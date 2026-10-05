import { safeTrim } from '../utils/string.js';
import { findUserByEmail } from '../services/authService.js';
import { loginWithPassword, registerWithPassword } from '../services/authApi.js';

export function renderLogin(app, { state, saveState, onLogin, feedback = null }) {
  if (!app) {
    console.error('[renderLogin] ERRO: elemento app não encontrado.');
    return;
  }

  app.innerHTML = `
    <section class="section-grid">
      <article class="card">
        <header>
          <h1>Portal K9 Fiscalização</h1>
          <p>Faça login ou crie um acesso para acompanhar operações de fiscalização marítima com suporte da nossa equipe K9 especializada.</p>
        </header>
        <form id="loginForm" novalidate>
          <div>
            <label for="loginEmail">E-mail corporativo*</label>
            <input id="loginEmail" name="email" type="email" autocomplete="email" required placeholder="nome@empresa.com" />
          </div>
          <div>
            <label for="loginPassword">Senha*</label>
            <input id="loginPassword" name="password" type="password" autocomplete="current-password" required minlength="6" placeholder="Digite sua senha" />
          </div>
          <div id="loginWelcomeBack" hidden>
            <p id="loginWelcomeMsg" class="feedback" data-type="success"></p>
          </div>
          <div id="loginNewUserFields">
            <div>
              <label for="loginName">Nome completo*</label>
              <input id="loginName" name="name" autocomplete="name" required placeholder="Ex.: Ana Costa" />
            </div>
            <input id="loginRole" name="role" type="hidden" value="client" />
            <div id="companyField" class="conditional-field">
              <label for="loginCompany">Empresa / Órgão*</label>
              <input id="loginCompany" name="company" placeholder="Informe a empresa ou órgão" />
            </div>
            <p class="feedback">Novos acessos são cadastrados como cliente. Operadores são provisionados pela administração.</p>
          </div>
          <p id="loginFeedback" role="status" aria-live="polite" class="feedback"></p>
          <button id="loginSubmitBtn" class="primary-button" type="submit">Entrar no sistema</button>
        </form>
      </article>
      <article class="card">
        <h2>Como funciona</h2>
        <ul class="list-clean">
          <li><strong>Clientes</strong> registram solicitações, acompanham inspeções e baixam relatórios.</li>
          <li><strong>Operadores</strong> recebem missões, atualizam checkpoints e emitem relatórios finais.</li>
          <li>Toda ação gera rastreabilidade automática para auditorias.</li>
        </ul>
        <br></br>
        <div class="tag-list" aria-label="Recursos principais">
          <span class="tag">Registro de inspeções</span>
          <span class="tag">Linha do tempo</span>
          <span class="tag">Relatórios inteligentes</span>
          <span class="tag">Mobile first</span>
        </div>
      </article>
    </section>
  `;

  const feedbackLabel = document.querySelector("#loginFeedback");
  const emailInput = document.querySelector("#loginEmail");
  const newUserFields = document.querySelector("#loginNewUserFields");
  const welcomeBack = document.querySelector("#loginWelcomeBack");
  const welcomeMsg = document.querySelector("#loginWelcomeMsg");
  const submitBtn = document.querySelector("#loginSubmitBtn");

  if (feedback) {
    feedbackLabel.textContent = feedback.message;
    feedbackLabel.dataset.type = feedback.type;
  }

  emailInput?.addEventListener("blur", () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;
    const found = state.users.find((item) => item.email === email);
    if (found) {
      welcomeMsg.textContent = `Bem-vindo de volta, ${found.name}! Clique em Entrar para continuar.`;
      welcomeBack.hidden = false;
      newUserFields.hidden = true;
      submitBtn.textContent = "Entrar";
    } else {
      welcomeBack.hidden = true;
      newUserFields.hidden = false;
      submitBtn.textContent = "Entrar no sistema";
    }
  });

  document.querySelector("#loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = safeTrim(data.get("name"));
    const email = safeTrim(data.get("email")).toLowerCase();
    const role = data.get("role");
    const company = safeTrim(data.get("company"));
    const password = safeTrim(data.get("password"));

    if (!email) {
      feedbackLabel.textContent = "Preencha o e-mail.";
      feedbackLabel.dataset.type = "error";
      return;
    }
    if (!password) {
      feedbackLabel.textContent = "Preencha a senha.";
      feedbackLabel.dataset.type = "error";
      return;
    }

    const existingUser = findUserByEmail(email, state);

    if (!existingUser && (!name || !role)) {
      feedbackLabel.textContent = "Preencha todas as informações obrigatórias.";
      feedbackLabel.dataset.type = "error";
      return;
    }

    try {
      submitBtn.disabled = true;
      const authResponse = existingUser
        ? await loginWithPassword({ email, password })
        : await registerWithPassword({ email, name, role, company, password });

      const user = authResponse.user;
      const index = state.users.findIndex((item) => item.id === user.id);
      if (index >= 0) {
        state.users[index] = { ...state.users[index], ...user };
      } else {
        state.users.push(user);
      }
      saveState();

      await onLogin(user.id, authResponse.token);
    } catch (error) {
      feedbackLabel.textContent = error?.message || "Falha ao autenticar.";
      feedbackLabel.dataset.type = "error";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

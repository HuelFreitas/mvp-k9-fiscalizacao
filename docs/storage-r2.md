# Evidências privadas com Cloudflare R2

O portal envia JPG, PNG e PDF diretamente do navegador para um bucket privado. A API gera URLs assinadas de curta duração e salva no Neon somente os metadados associados à solicitação.

## 1. Criar o bucket

1. No painel da Cloudflare, abra **Storage & databases > R2**.
2. Crie um bucket, por exemplo `k9-evidencias`, usando a classe **Standard**.
3. Mantenha o acesso público desabilitado.

## 2. Criar credenciais restritas

Em **R2 > Manage API Tokens**, crie um token com leitura e escrita limitado apenas ao bucket criado. Guarde o Access Key ID e o Secret Access Key; o segredo não poderá ser consultado novamente.

Nunca coloque essas credenciais no frontend, no GitHub ou em arquivos `.env` versionados.

## 3. Configurar CORS do bucket

Permita que apenas o portal publicado envie e leia cabeçalhos das operações assinadas:

```json
[
  {
    "AllowedOrigins": [
      "https://mvp-k9-fiscalizacao-web.onrender.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Se o Render atribuir outra URL ao frontend, substitua a origem no exemplo.

## 4. Configurar a API no Render

Abra o serviço `mvp-k9-fiscalizacao-api` e adicione estas variáveis protegidas:

| Variável | Valor |
|---|---|
| `R2_ACCOUNT_ID` | ID da conta Cloudflare |
| `R2_BUCKET_NAME` | Nome do bucket, por exemplo `k9-evidencias` |
| `R2_ACCESS_KEY_ID` | Access Key ID do token |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key do token |

O `render.yaml` já declara as quatro variáveis. Após o push, sincronize o Blueprint e preencha os valores quando solicitado, ou cadastre-os diretamente em **Environment**.

## 5. Validar

1. Faça login como cliente ou operador.
2. Abra os detalhes de uma solicitação.
3. Envie uma imagem ou PDF de até 10 MB.
4. Abra o arquivo pelo botão de visualização.
5. Saia, entre novamente e confirme que a evidência continua listada.
6. Remova a evidência e confirme que ela desaparece após atualizar a página.

Cada solicitação aceita no máximo 10 evidências. Links de upload expiram em 10 minutos; links de download expiram em 5 minutos.

## Segurança e evolução

- O bucket permanece privado e as chaves existem somente no backend.
- A API valida perfil, vínculo com a solicitação, MIME type, tamanho e quantidade.
- A confirmação consulta o objeto no R2 antes de persistir seus metadados no Neon.
- Para uso além do MVP, adicione análise antivírus, geração de miniaturas e política de retenção.


Problema identificado: hoje a avaliação só é salva no último CTA da tela final, depois de uma etapa extra de telefone/cupom. Isso cria a sensação de que a resposta “não foi”, principalmente se a pessoa parar em “Quase lá” ou achar que já concluiu ao responder a última pergunta. Além disso, o código de envio não valida `error` retornado pelo banco, então uma falha de insert pode passar sem tratamento adequado.

Plano de correção

1. Ajustar o momento do salvamento
- Salvar a resposta assim que o usuário chegar ao estado final do fluxo, antes da etapa opcional de telefone/cupom.
- Manter a coleta de telefone e o botão da loja como pós-conclusão, sem depender disso para gravar a avaliação.

2. Corrigir o tratamento de erro do envio
- Atualizar `handleSubmit` em `src/components/feedback/FeedbackSurvey.tsx` para capturar `{ error }` do insert e interromper o fluxo se houver falha real.
- Exibir feedback visível quando o envio falhar.

3. Evitar duplicidade e confusão no fluxo final
- Separar claramente:
  - conclusão da pesquisa
  - tela opcional de WhatsApp/cupom
  - ida para a loja
- Garantir que clicar em “Pular” na etapa de telefone não impeça o registro.

4. Revisar a página `/results`
- Hoje ela tem uma segunda coleta de telefone independente, o que duplica o fluxo.
- Simplificar para virar apenas tela de agradecimento/cupom, ou remover a dependência dela no processo de conclusão.

5. Melhorar rastreabilidade
- Salvar no `localStorage` um status como “submitted” com timestamp/id local para indicar que a avaliação foi concluída.
- Isso ajuda a distinguir “respondi tudo” de “realmente foi salvo”.

Arquivos a ajustar
- `src/components/feedback/FeedbackSurvey.tsx`
- `src/pages/Results.tsx`

Validação após implementar
- Fluxo completo respondendo até o fim e confirmando novo registro no banco
- Fluxo completo clicando em “Pular” no telefone
- Fluxo com telefone preenchido
- Garantir que não cria registro duplicado ao avançar para cupom/loja

Detalhe técnico
- O banco está conectado e atualmente há 5 registros salvos; o último é de `2026-04-01 19:55:24+00`.
- O principal problema não parece ser conexão, e sim desenho do fluxo de conclusão + tratamento incompleto do retorno do insert.

Diagrama resumido
```text
Hoje:
perguntas -> tela final -> telefone/cupom -> botão final -> salvar

Proposto:
perguntas -> salvar imediatamente -> telefone/cupom opcional -> loja/agradecimento
```

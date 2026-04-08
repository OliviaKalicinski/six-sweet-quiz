

## Corrigir o mapeamento de dados do survey

### Problema
O survey mudou de formulário linear (NPS, expectativas, etc.) para uma árvore de decisão sim/não, mas o código de salvamento continua usando as colunas antigas com valores fixos como `"survey_v3"` e `nps_score: 0`. As respostas de texto vão todas para `liked_most` como JSON, e o caminho percorrido não é salvo no banco.

### Solução

**1. Adicionar colunas para o novo formato**
- `survey_path` (text[]): sequência de step IDs percorridos (ex: `["gate_tried","active_q1","active_q2"]`)
- `survey_answers` (jsonb): respostas de texto e o end state alcançado (ex: `{"active_q3_pet_tentou":"misturei com ração","end_state":"end_dica","end_text":""}`)
- `end_state` (text): ID do estado final atingido (ex: `"end_dica"`, `"end_pos"`)

**2. Atualizar o insert no FeedbackSurvey.tsx**
- Gravar `survey_path` com o histórico completo
- Gravar `survey_answers` com as respostas de texto + texto do end state
- Gravar `end_state` com o step final
- Manter `segment` e `churn_status` corretamente
- Remover valores placeholder dos campos antigos — usar strings vazias ou null
- Continuar gravando `customer_name` e `phone` como já faz

**3. Manter compatibilidade com o Admin dashboard**
- Atualizar `src/pages/Admin.tsx` para exibir as novas colunas (`end_state`, `survey_answers`) em vez dos campos antigos que estão vazios
- Mostrar o caminho percorrido e as respostas de texto de forma legível

### Arquivos a modificar
- **Migração SQL**: adicionar 3 colunas (`survey_path`, `survey_answers`, `end_state`)
- **`src/components/feedback/FeedbackSurvey.tsx`**: atualizar o insert (linhas 652-666)
- **`src/pages/Admin.tsx`**: exibir os novos campos corretamente

### Resultado esperado
Cada resposta vai registrar: nome, segmento, churn status, caminho completo de sim/não, respostas de texto, e o estado final — tudo consultável e exportável.


# Como Aplicar a Migração do Sistema de Horários

## 📋 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Aplicar a Migração SQL

1. No painel lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o seguinte SQL:

```sql
-- Adicionar coluna meeting_time na tabela meetings
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(5);

-- Adicionar comentário para documentação
COMMENT ON COLUMN meetings.meeting_time IS 'Horário da reunião no formato HH:MM (ex: 09:00, 14:00)';

-- Criar índice para melhorar performance nas consultas de horários disponíveis
CREATE INDEX IF NOT EXISTS idx_meetings_date_time_status 
ON meetings(meeting_date, meeting_time, status);
```

4. Clique em **Run** para executar a migração

### 3. Verificar a Migração

Para confirmar que a coluna foi criada corretamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'meetings' 
AND column_name = 'meeting_time';
```

Você deve ver:
- column_name: `meeting_time`
- data_type: `character varying`

## ✅ Pronto!

A migração está completa! O sistema agora:

- ✅ Exibe 4 horários disponíveis por dia (09:00, 11:00, 14:00, 16:00)
- ✅ Verifica automaticamente horários ocupados
- ✅ Bloqueia horários já agendados para outros usuários
- ✅ Armazena o horário escolhido no banco de dados
- ✅ Popup de horário com design minimalista (igual ao calendário)

## 🎨 Horários Disponíveis

Os horários padrão são:
- **09:00** - Manhã
- **11:00** - Fim da manhã
- **14:00** - Início da tarde
- **16:00** - Tarde

Para alterar esses horários, edite o arquivo `src/lib/meeting-times.ts`:

```typescript
export const AVAILABLE_TIMES = [
  '09:00',
  '11:00',
  '14:00',
  '16:00'
];
```


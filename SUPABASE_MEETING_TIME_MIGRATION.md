# Migração do Banco de Dados - Adicionar Campo de Horário

## Objetivo
Adicionar o campo `meeting_time` à tabela `meetings` para permitir o agendamento de horários específicos e controlar a disponibilidade.

## SQL Migration

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Adicionar coluna meeting_time à tabela meetings
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(5);

-- Adicionar comentário na coluna
COMMENT ON COLUMN meetings.meeting_time IS 'Horário da reunião no formato HH:MM (ex: 09:00, 14:00)';

-- Criar índice para melhorar performance das consultas de disponibilidade
CREATE INDEX IF NOT EXISTS idx_meetings_date_time 
ON meetings(meeting_date, meeting_time) 
WHERE status IN ('pending', 'confirmed');

-- Adicionar constraint para validar formato do horário (opcional mas recomendado)
ALTER TABLE meetings
ADD CONSTRAINT check_meeting_time_format 
CHECK (meeting_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$');
```

## Horários Disponíveis

O sistema está configurado com 4 horários por dia:
- **09:00** - Manhã
- **11:00** - Meio-dia
- **14:00** - Tarde
- **16:00** - Final da tarde

Estes horários estão definidos em: `src/components/ui/time-selector.tsx`

## Como Funciona

### 1. Verificação de Disponibilidade
Quando o usuário seleciona uma data, o sistema:
1. Busca todas as reuniões confirmadas/pendentes para aquela data
2. Filtra os horários já ocupados
3. Exibe apenas os horários disponíveis

### 2. Validação no Agendamento
Antes de confirmar o agendamento:
1. Verifica novamente se o horário ainda está disponível
2. Se estiver ocupado, alerta o usuário e solicita nova seleção
3. Se disponível, salva a reunião com data + horário

### 3. Campos na Tabela `meetings`

```typescript
interface Meeting {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  project_type: string;
  project_description: string;
  timeline: string;
  budget: string;
  meeting_date: string;      // Data no formato ISO (YYYY-MM-DD)
  meeting_time: string;      // NOVO: Horário no formato HH:MM
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}
```

## Arquivos Modificados

1. **`src/components/ui/time-selector.tsx`** (NOVO)
   - Componente de seleção de horários
   - Verifica disponibilidade via Supabase
   - UI consistente com o seletor de data

2. **`src/app/solicitar-reuniao/page.tsx`**
   - Adicionada pergunta de horário (ID 9)
   - Validação de disponibilidade antes do submit
   - Salvamento do horário no banco

## Testando

1. Execute a migration SQL no Supabase
2. Teste agendar uma reunião e selecionar um horário
3. Tente agendar outra reunião no mesmo horário/data
4. Verifique que o horário não aparece mais como disponível

## Rollback (se necessário)

```sql
-- Remover constraint
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS check_meeting_time_format;

-- Remover índice
DROP INDEX IF EXISTS idx_meetings_date_time;

-- Remover coluna (CUIDADO: isso apaga os dados!)
ALTER TABLE meetings DROP COLUMN IF EXISTS meeting_time;
```


-- Adicionar coluna meeting_time na tabela meetings
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(5);

-- Adicionar comentário para documentação
COMMENT ON COLUMN meetings.meeting_time IS 'Horário da reunião no formato HH:MM (ex: 09:00, 14:00)';

-- Criar índice para melhorar performance nas consultas de horários disponíveis
CREATE INDEX IF NOT EXISTS idx_meetings_date_time_status 
ON meetings(meeting_date, meeting_time, status);


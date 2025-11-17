-- Adicionar coluna meeting_time à tabela meetings
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_time TIME;

-- Criar índice para melhorar performance nas consultas de disponibilidade
CREATE INDEX IF NOT EXISTS idx_meetings_date_time_status 
ON meetings(meeting_date, meeting_time, status);

-- Comentário explicativo
COMMENT ON COLUMN meetings.meeting_time IS 'Horário da reunião (apenas hora e minuto)';


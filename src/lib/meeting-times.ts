import { supabase } from './supabase';

// Horários disponíveis para agendamento
export const AVAILABLE_TIMES = [
  '09:00',
  '11:00',
  '14:00',
  '16:00'
];

/**
 * Busca horários já ocupados para uma data específica
 */
export async function getBookedTimes(date: Date): Promise<string[]> {
  try {
    // Formatar data para comparação no banco (apenas a data, sem hora)
    const dateStr = date.toISOString().split('T')[0];
    
    const { data, error } = await (supabase as any)
      .from('meetings')
      .select('meeting_time')
      .gte('meeting_date', `${dateStr}T00:00:00.000Z`)
      .lt('meeting_date', `${dateStr}T23:59:59.999Z`)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      return [];
    }

    return data?.map((meeting: any) => meeting.meeting_time).filter(Boolean) || [];
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return [];
  }
}

/**
 * Retorna apenas os horários disponíveis para uma data
 */
export async function getAvailableTimes(date: Date | null): Promise<string[]> {
  if (!date) return [];

  // Verificar se é data passada
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (normalizedDate.getTime() < normalizedToday.getTime()) {
    return []; // Não permitir agendamentos em datas passadas
  }

  const bookedTimes = await getBookedTimes(date);
  return AVAILABLE_TIMES.filter(time => !bookedTimes.includes(time));
}

/**
 * Verifica se um horário específico está disponível
 */
export async function isTimeAvailable(date: Date, time: string): Promise<boolean> {
  const availableTimes = await getAvailableTimes(date);
  return availableTimes.includes(time);
}


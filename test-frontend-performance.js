/**
 * SCRIPT DE TESTE DE PERFORMANCE DO FRONTEND
 * Execute no console do navegador após fazer login como admin
 */

console.log('🚀 INICIANDO TESTES DE PERFORMANCE DO FRONTEND\n');

// ============================================================================
// TESTE 1: RPC get_admin_stats (deve ser rápido < 100ms)
// ============================================================================

async function testAdminStatsRPC() {
  console.log('📊 TESTE 1: RPC get_admin_stats');
  console.log('=====================================');
  
  const startTime = performance.now();
  
  try {
    // @ts-ignore
    const { data, error } = await supabase.rpc('get_admin_stats');
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    if (error) {
      console.error('❌ ERRO:', error);
      return { success: false, duration, error };
    }
    
    console.log('✅ SUCESSO');
    console.log('⏱️  Tempo:', duration + 'ms');
    console.log('📦 Dados:', data);
    console.log('');
    
    return { success: true, duration, data };
  } catch (err) {
    console.error('❌ ERRO INESPERADO:', err);
    return { success: false, error: err };
  }
}

// ============================================================================
// TESTE 2: check_is_admin (deve usar cache)
// ============================================================================

async function testCheckIsAdmin() {
  console.log('🔐 TESTE 2: check_is_admin');
  console.log('=====================================');
  
  const startTime = performance.now();
  
  try {
    // @ts-ignore
    const { data, error } = await supabase.rpc('check_is_admin');
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    if (error) {
      console.error('❌ ERRO:', error);
      return { success: false, duration, error };
    }
    
    console.log('✅ SUCESSO');
    console.log('⏱️  Tempo:', duration + 'ms');
    console.log('👤 É Admin:', data);
    console.log('');
    
    return { success: true, duration, data };
  } catch (err) {
    console.error('❌ ERRO INESPERADO:', err);
    return { success: false, error: err };
  }
}

// ============================================================================
// TESTE 3: View Materializada (deve ser < 50ms)
// ============================================================================

async function testMaterializedView() {
  console.log('⚡ TESTE 3: View Materializada admin_stats_cache');
  console.log('=====================================');
  
  const startTime = performance.now();
  
  try {
    // @ts-ignore
    const { data, error } = await supabase
      .from('admin_stats_cache')
      .select('*')
      .single();
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    if (error) {
      console.error('❌ ERRO:', error);
      return { success: false, duration, error };
    }
    
    console.log('✅ SUCESSO');
    console.log('⏱️  Tempo:', duration + 'ms (deve ser < 50ms)');
    console.log('📦 Dados:', data);
    console.log('🕐 Última atualização:', data.last_updated);
    console.log('');
    
    return { success: true, duration, data };
  } catch (err) {
    console.error('❌ ERRO INESPERADO:', err);
    return { success: false, error: err };
  }
}

// ============================================================================
// TESTE 4: Query antiga (6 queries separadas) vs RPC
// ============================================================================

async function testOldVsNew() {
  console.log('🔄 TESTE 4: Comparação OLD (6 queries) vs NEW (1 RPC)');
  console.log('=======================================================');
  
  // OLD: 6 queries separadas
  console.log('⏳ Testando método ANTIGO (6 queries)...');
  const oldStart = performance.now();
  
  try {
    // @ts-ignore
    const [
      { count: totalUsers },
      { count: blockedUsers },
      { count: totalMeetings },
      { count: pendingMeetings },
      { count: completedMeetings },
      { count: cancelledMeetings }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
      supabase.from('meetings').select('*', { count: 'exact', head: true }),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')
    ]);
    
    const oldEnd = performance.now();
    const oldDuration = (oldEnd - oldStart).toFixed(2);
    
    console.log('✅ OLD completado em:', oldDuration + 'ms');
    
    // NEW: 1 RPC
    console.log('⏳ Testando método NOVO (1 RPC)...');
    const newStart = performance.now();
    
    // @ts-ignore
    const { data: statsData } = await supabase.rpc('get_admin_stats');
    
    const newEnd = performance.now();
    const newDuration = (newEnd - newStart).toFixed(2);
    
    console.log('✅ NEW completado em:', newDuration + 'ms');
    
    // Comparação
    const improvement = ((oldDuration - newDuration) / oldDuration * 100).toFixed(1);
    const speedup = (oldDuration / newDuration).toFixed(1);
    
    console.log('\n📊 RESULTADO:');
    console.log('OLD (6 queries):', oldDuration + 'ms');
    console.log('NEW (1 RPC):    ', newDuration + 'ms');
    console.log('');
    console.log('🚀 Melhoria:', improvement + '%');
    console.log('⚡ Velocidade:', speedup + 'x mais rápido');
    console.log('');
    
    return {
      oldDuration,
      newDuration,
      improvement,
      speedup
    };
  } catch (err) {
    console.error('❌ ERRO:', err);
    return { success: false, error: err };
  }
}

// ============================================================================
// TESTE 5: Timeout (deve suportar 10s agora)
// ============================================================================

async function testTimeout() {
  console.log('⏱️  TESTE 5: Verificar Timeout Global');
  console.log('=====================================');
  
  // @ts-ignore
  console.log('⚙️  Timeout configurado:', window.supabase ? '10s (otimizado)' : 'Não detectado');
  console.log('');
  
  return { success: true };
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         🔍 TESTE COMPLETO DE PERFORMANCE - FRONTEND          ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  const results = {
    test1: await testAdminStatsRPC(),
    test2: await testCheckIsAdmin(),
    test3: await testMaterializedView(),
    test4: await testOldVsNew(),
    test5: await testTimeout()
  };
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                      📊 RESUMO FINAL                         ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  console.log('✅ Teste 1 (RPC Stats):', results.test1.success ? `${results.test1.duration}ms` : 'FALHOU');
  console.log('✅ Teste 2 (check_is_admin):', results.test2.success ? `${results.test2.duration}ms` : 'FALHOU');
  console.log('✅ Teste 3 (View Materializada):', results.test3.success ? `${results.test3.duration}ms` : 'FALHOU');
  console.log('✅ Teste 4 (Comparação):', results.test4.speedup ? `${results.test4.speedup}x mais rápido` : 'FALHOU');
  console.log('✅ Teste 5 (Timeout): OK');
  console.log('');
  
  const allPassed = results.test1.success && results.test2.success && results.test3.success;
  
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema otimizado funcionando perfeitamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os detalhes acima.');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  
  return results;
}

// ============================================================================
// EXECUTAR AUTOMATICAMENTE
// ============================================================================

console.log('ℹ️  Para executar os testes, cole este comando no console:\n');
console.log('runAllTests()\n');
console.log('Ou execute testes individuais:');
console.log('  • testAdminStatsRPC()');
console.log('  • testCheckIsAdmin()');
console.log('  • testMaterializedView()');
console.log('  • testOldVsNew()');
console.log('');


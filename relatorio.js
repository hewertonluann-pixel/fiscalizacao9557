// relatorio.js — Relatório PDF aprimorado (sem nomes de fiscais)
export function gerarPDF(lancamentos, sess, dIni, dFim, numInput) {
  if (!lancamentos || lancamentos.length === 0) {
    alert('Nenhum dado carregado.');
    return;
  }

  const filtrado = lancamentos.filter(r => {
    const d = new Date(r.data);
    return (!dIni || d >= new Date(dIni)) && (!dFim || d <= new Date(dFim));
  });

  if (filtrado.length === 0) {
    alert('Nenhum lançamento no período.');
    return;
  }

  // ===== Agrupar apenas por tipo de serviço (sem identificar fiscais)
  const resumo = {};
  filtrado.forEach(r => {
    resumo[r.descricaoResumida] =
      (resumo[r.descricaoResumida] || 0) + Number(r.quantidade || 0);
  });

  // ===== Totais
  let totalGeral = 0, totalArrec = 0;
  filtrado.forEach(r => {
    totalGeral += Number(r.quantidade || 0);
    totalArrec += Number(r.valor || 0);
  });

  // ===== Dados do relatório
  let num = parseInt(numInput || '0');
  num = num > 0 ? num : (Number(localStorage.getItem('numero_relatorio') || '0') + 1);
  if (numInput <= 0) localStorage.setItem('numero_relatorio', num);

  const dataGer = new Date().toLocaleDateString('pt-BR');
  const ano = new Date().getFullYear();
  const gerente = sess?.nome || '—';
  const totalBRL = Number(totalArrec || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  const formatarData = d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
  const periodo = `${formatarData(dIni)} a ${formatarData(dFim)}`;

  // ===== HTML estilizado do relatório
  const relatorio = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;line-height:1.5;word-wrap:break-word;">
    
    <!-- Cabeçalho institucional -->
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;">
      <img src="brasao.png" alt="Brasão" style="height:65px;">
      <div style="text-align:center;">
        <h3 style="margin:0;">PREFEITURA MUNICIPAL DE DIAMANTINA</h3>
        <h4 style="margin:0;">SECRETARIA MUNICIPAL DE FAZENDA</h4>
        <h4 style="margin:0;">Diretoria de Fiscalização e Tributação</h4>
      </div>
    </div>

    <hr style="margin:4px 0 8px 0;border:0;border-top:2px solid #444;">
    <h3 style="text-align:center;margin:0;">RELATÓRIO DE PRODUTIVIDADE Nº ${String(num).padStart(3,'0')}/${ano}</h3>

    <!-- Dados básicos -->
    <p style="margin-top:6px;font-size:14px;">
      <strong>DE:</strong> Diretoria de Fiscalização e Tributação<br>
      <strong>PARA:</strong> Secretaria da Fazenda<br>
      <strong>ASSUNTO:</strong> Produtividade Fiscal<br>
      <strong>DATA:</strong> ${dataGer}
    </p>

    <p style="margin-top:8px;font-size:14px;">
      Em resposta à solicitação, seguem as atividades realizadas neste setor entre
      <strong>${periodo}</strong>:
    </p>

    <!-- Tabela de serviços -->
    <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:6px;border-bottom:2px solid #444;">Tipo de Serviço</th>
          <th style="text-align:right;padding:6px;border-bottom:2px solid #444;">Quantidade</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(resumo)
          .map(
            ([serv, qtd]) => `
            <tr>
              <td style="border-bottom:1px solid #ddd;padding:5px 8px;">${serv}</td>
              <td style="text-align:right;border-bottom:1px solid #ddd;padding:5px 8px;">${qtd}</td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <!-- Resumo -->
    <div style="margin-top:14px;padding:10px;border:1px solid #ccc;border-radius:6px;background:#f9fafb;">
      <strong>Total de atividades:</strong> ${totalGeral}<br>
      <strong>Valor arrecadado:</strong> ${totalBRL}
    </div>

    <!-- Fechamento -->
    <p style="margin-top:16px;font-size:14px;">
      Sendo o que temos para o momento, colocamo-nos à disposição para maiores esclarecimentos.
    </p>

    <!-- Assinatura -->
    <p style="margin-top:32px;text-align:center;font-size:14px;">
      Atenciosamente,<br><br>
      <strong>Gerência de Fiscalização Tributária</strong><br>
      Prefeitura Municipal de Diamantina/MG
    </p>

    <!-- Rodapé -->
    <hr style="margin:18px 0;border:0;border-top:1px solid #999;">
    <p style="text-align:center;font-size:12px;color:#444;">
      <strong>Gerente:</strong> ${gerente} — ${dataGer}<br>
      <em>Gerado automaticamente pelo Sistema de Produção • v1.0</em>
    </p>
  </div>`;

  // ===== Geração do PDF
  html2pdf()
    .set({
      margin: [5, 10, 5, 10], // alinhado ao topo
      filename: `Relatorio_${String(num).padStart(3,'0')}_${ano}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(relatorio)
    .save();
}

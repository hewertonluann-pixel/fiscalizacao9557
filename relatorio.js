// relatorio.js
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

  // Agrupar apenas por tipo de serviço (sem identificar fiscais)
  const resumo = {};
  filtrado.forEach(r => {
    resumo[r.descricaoResumida] =
      (resumo[r.descricaoResumida] || 0) + Number(r.quantidade || 0);
  });

  // Totais
  let totalArrec = 0;
  filtrado.forEach(r => (totalArrec += Number(r.valor || 0)));

  // Número do relatório
  let num = parseInt(numInput || '0');
  num = num > 0 ? num : (Number(localStorage.getItem('numero_relatorio') || '0') + 1);
  if (numInput <= 0) localStorage.setItem('numero_relatorio', num);

  const dataGer = new Date().toLocaleDateString('pt-BR');
  const ano = new Date().getFullYear();
  const gerente = sess?.nome || '—';
  const totalBRL = Number(totalArrec || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const formatarData = d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
  const periodo = `${formatarData(dIni)} a ${formatarData(dFim)}`;

  const relatorio = `
  <div style="font-family:Arial;max-width:750px;margin:0 auto;line-height:1.4;word-wrap:break-word;">
    <h3 style="text-align:center;margin:0;">PREFEITURA MUNICIPAL DE DIAMANTINA</h3>
    <h4 style="text-align:center;margin:0;">SECRETARIA MUNICIPAL DE FAZENDA</h4>
    <h4 style="text-align:center;margin:0;">Diretoria de Fiscalização e Tributação</h4>
    <hr style="margin:4px 0;">
    <h3 style="text-align:center;margin:0;">RELATÓRIO PRODUTIVIDADE ${String(num).padStart(3,'0')}/${ano}</h3>
    <p style="margin-top:6px;"><strong>DE:</strong> Diretoria de Fiscalização e Tributação<br>
    <strong>PARA:</strong> Secretaria da Fazenda<br>
    <strong>ASSUNTO:</strong> Produtividade Fiscal<br>
    <strong>DATA:</strong> ${dataGer}</p>
    <p style="margin-top:8px;">Atividades realizadas entre <strong>${periodo}</strong>:</p>
    <table style="width:100%;border-collapse:collapse;margin-top:6px;">
      ${Object.entries(resumo)
        .map(
          ([serv, qtd]) => `
        <tr>
          <td style="border-bottom:1px dotted #999;padding:4px 6px;">${serv}</td>
          <td style="text-align:right;border-bottom:1px dotted #999;padding:4px 6px;">${qtd}</td>
        </tr>`
        )
        .join('')}
    </table>
    <p style="margin-top:12px;"><strong>Valor arrecadado no período:</strong> ${totalBRL}</p>
    <p style="margin-top:12px;">Sendo o que temos para o momento, nos colocamos à disposição para maiores esclarecimentos.</p>
    <p style="margin-top:24px;text-align:center;">Atenciosamente,<br><br><strong>Gerência de Fiscalização Tributária</strong><br>Prefeitura Municipal de Diamantina/MG</p>
    <hr style="margin:18px 0;">
    <p style="text-align:center;font-size:12px;"><strong>Gerente:</strong> ${gerente} — ${dataGer}</p>
  </div>`;

  html2pdf()
    .set({
      margin: [0, 10, 0, 10], // 🔹 topo e rodapé sem margem
      filename: `Relatorio_${String(num).padStart(3,'0')}_${ano}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 1.5, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(relatorio)
    .save();
}

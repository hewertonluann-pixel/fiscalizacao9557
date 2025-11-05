// relatorio.js
export function gerarPDF(lancamentos, sess, dIni, dFim) {
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

  // Agrupamento por Fiscal
  const porFiscal = {};
  filtrado.forEach(r => {
    if (!porFiscal[r.usuario]) porFiscal[r.usuario] = {};
    porFiscal[r.usuario][r.descricaoResumida] =
      (porFiscal[r.usuario][r.descricaoResumida] || 0) + Number(r.quantidade || 0);
  });

  // Totais
  let totalGeral = 0,
    totalArrec = 0;
  filtrado.forEach(r => {
    totalGeral += Number(r.quantidade || 0);
    totalArrec += Number(r.valor || 0);
  });

  const dataGer = new Date().toLocaleDateString('pt-BR');
  const ano = new Date().getFullYear();
  const gerente = sess?.nome || '—';
  const totalBRL = Number(totalArrec || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const formatarData = d =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
  const periodo = `${formatarData(dIni)} a ${formatarData(dFim)}`;

  // Montagem de blocos por fiscal
  const blocos = Object.entries(porFiscal)
    .map(([fiscal, servicos]) => {
      const linhas = Object.entries(servicos)
        .map(
          ([s, q]) =>
            `<tr><td style="border-bottom:1px dotted #999;padding:4px 6px;">${s}</td>
             <td style="text-align:right;border-bottom:1px dotted #999;padding:4px 6px;">${q}</td></tr>`
        )
        .join('');
      return `<h4 style="margin-top:20px;">${fiscal}</h4>
              <table style="width:100%;border-collapse:collapse;margin-top:6px;">${linhas}</table>`;
    })
    .join('');

  const relatorio = `
  <div style="font-family:Arial;max-width:750px;margin:0 auto;line-height:1.5;word-wrap:break-word;">
    <h3 style="text-align:center;margin:0;">PREFEITURA MUNICIPAL DE DIAMANTINA</h3>
    <h4 style="text-align:center;margin:0;">SECRETARIA MUNICIPAL DE FAZENDA</h4>
    <h4 style="text-align:center;margin:0;">Diretoria de Fiscalização e Tributação</h4>
    <hr style="margin:6px 0;">
    <h3 style="text-align:center;margin:0;">RELATÓRIO PRODUTIVIDADE ${ano}</h3>
    <p><strong>DE:</strong> Diretoria de Fiscalização e Tributação<br>
    <strong>PARA:</strong> Secretaria da Fazenda<br>
    <strong>ASSUNTO:</strong> Produtividade Fiscal<br>
    <strong>DATA:</strong> ${dataGer}</p>
    <p style="margin-top:12px;">Atividades realizadas entre <strong>${periodo}</strong>:</p>
    ${blocos}
    <p style="margin-top:20px;"><strong>Total geral:</strong> ${totalGeral} atividades<br>
    <strong>Valor arrecadado:</strong> ${totalBRL}</p>
    <p style="margin-top:30px;text-align:center;">Atenciosamente,<br><br><strong>Gerência de Fiscalização Tributária</strong><br>Prefeitura Municipal de Diamantina/MG</p>
    <hr style="margin:20px 0;">
    <p style="text-align:center;font-size:12px;"><strong>Gerente:</strong> ${gerente} — ${dataGer}</p>
  </div>`;

  html2pdf()
    .set({
      margin: [0, 10, 5, 10],
      filename: `Relatorio_${ano}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 1.5, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(relatorio)
    .save();
}

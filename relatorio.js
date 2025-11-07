// relatorio.js — Relatório PDF otimizado com gráfico horizontal e tabela dupla compacta
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

  // ===== Agrupar por tipo de serviço
  const resumo = {};
  filtrado.forEach(r => {
    const tipo = r.descricaoResumida || r.tipoServico || 'Não especificado';
    resumo[tipo] = (resumo[tipo] || 0) + Number(r.quantidade || 0);
  });

  // ===== Totais
  let totalGeral = 0, totalArrec = 0;
  let totalISS = 0, totalTFLF = 0;
  const outrosValores = {};

  filtrado.forEach(r => {
    const valor = Number(r.valor || 0);
    totalGeral += Number(r.quantidade || 0);
    totalArrec += valor;

    const tipo = (r.descricaoResumida || '').toLowerCase();
    if (tipo.includes('lançamento de tributo') || tipo.includes('emissão de guia de issqn')) {
      totalISS += valor;
    } else if (tipo.includes('apuração de tflf')) {
      totalTFLF += valor;
    } else {
      outrosValores[r.descricaoResumida || 'Outros'] =
        (outrosValores[r.descricaoResumida || 'Outros'] || 0) + valor;
    }
  });

  const totalOutros = totalArrec - totalISS - totalTFLF;

  // ===== Dados do relatório
  let num = parseInt(numInput || '0');
  num = num > 0 ? num : (Number(localStorage.getItem('numero_relatorio') || '0') + 1);
  if (numInput <= 0) localStorage.setItem('numero_relatorio', num);

  const dataGer = new Date().toLocaleDateString('pt-BR');
  const ano = new Date().getFullYear();
  const gerente = sess?.nome || '—';
  const totalBRL = totalArrec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarData = d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
  const periodo = `${formatarData(dIni)} a ${formatarData(dFim)}`;

  // ===== Compactar a tabela em duas colunas
  const pares = Object.entries(resumo).filter(([_, qtd]) => qtd > 0);
  const metade = Math.ceil(pares.length / 2);
  const col1 = pares.slice(0, metade);
  const col2 = pares.slice(metade);

  // ===== HTML inicial
  let html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;">
      <img src="brasao.png" alt="Brasão" style="height:65px;">
      <div style="text-align:center;">
        <h3 style="margin:0;">PREFEITURA MUNICIPAL DE DIAMANTINA</h3>
        <h4 style="margin:0;">SECRETARIA MUNICIPAL DE FAZENDA</h4>
        <h4 style="margin:0;">Diretoria de Fiscalização e Tributação</h4>
      </div>
    </div>

    <hr style="margin:4px 0 8px;border:0;border-top:2px solid #444;">
    <h3 style="text-align:center;margin:0;">RELATÓRIO DE PRODUTIVIDADE Nº ${String(num).padStart(3,'0')}/${ano}</h3>

    <p style="margin-top:6px;font-size:13px;">
      <strong>DE:</strong> Diretoria de Fiscalização e Tributação<br>
      <strong>PARA:</strong> Secretaria da Fazenda<br>
      <strong>ASSUNTO:</strong> Produtividade Fiscal<br>
      <strong>DATA:</strong> ${dataGer}
    </p>

    <p style="margin-top:8px;font-size:13px;">
      Seguem as atividades realizadas no período de <strong>${periodo}</strong>:
    </p>

    <!-- ===== TABELA DUPLA COMPACTA ===== -->
    <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:3px 6px;border-bottom:2px solid #444;">Tipo de Serviço</th>
          <th style="text-align:right;padding:3px 6px;border-bottom:2px solid #444;">Qtd</th>
          <th style="text-align:left;padding:3px 6px;border-bottom:2px solid #444;">Tipo de Serviço</th>
          <th style="text-align:right;padding:3px 6px;border-bottom:2px solid #444;">Qtd</th>
        </tr>
      </thead>
      <tbody>
        ${col1.map((c, i) => {
          const direita = col2[i];
          return `
            <tr>
              <td style="padding:3px 6px;border-bottom:1px solid #ddd;">${c[0]}</td>
              <td style="text-align:right;padding:3px 6px;border-bottom:1px solid #ddd;">${c[1]}</td>
              <td style="padding:3px 6px;border-bottom:1px solid #ddd;">${direita ? direita[0] : ''}</td>
              <td style="text-align:right;padding:3px 6px;border-bottom:1px solid #ddd;">${direita ? direita[1] : ''}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- ===== RESUMO FINANCEIRO ===== -->
    <div style="margin-top:14px;padding:10px;border:1px solid #ccc;border-radius:6px;background:#f9fafb;font-size:13px;">
      <strong>Total de atividades:</strong> ${totalGeral}<br>
      <strong>Valor arrecadado:</strong> ${totalBRL}<br><br>
      <strong>Composição do valor arrecadado:</strong><br>
      • ISSQN (Lançamento de Tributo): ${totalISS.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}<br>
      • TFLF (Apuração de TFLF): ${totalTFLF.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}<br>
      • Outros serviços: ${totalOutros.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
    </div>

    <h4 style="text-align:center;margin-top:20px;">Composição visual do valor arrecadado</h4>
    <canvas id="graficoComposicao" width="600" height="220"></canvas>

    ${totalOutros > 0 ? `
      <h4 style="margin-top:22px;">Detalhamento dos "Outros Serviços"</h4>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:4px 6px;border-bottom:2px solid #444;">Tipo de Serviço</th>
          <th style="text-align:right;padding:4px 6px;border-bottom:2px solid #444;">Valor (R$)</th>
        </tr></thead>
        <tbody>
          ${Object.entries(outrosValores)
            .map(([serv, val]) => `
              <tr>
                <td style="border-bottom:1px solid #ddd;padding:3px 6px;">${serv}</td>
                <td style="text-align:right;border-bottom:1px solid #ddd;padding:3px 6px;">
                  ${val.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}
  </div>
  `;

  // ===== Renderizar gráfico com Chart.js
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const canvas = container.querySelector('#graficoComposicao');
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
  script.onload = () => {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['ISSQN', 'TFLF', 'Outros'],
        datasets: [{
          label: 'Valor arrecadado (R$)',
          data: [totalISS, totalTFLF, totalOutros],
          backgroundColor: ['#2563eb', '#16a34a', '#6b7280']
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: v => 'R$ ' + v.toLocaleString('pt-BR')
            }
          }
        }
      }
    });

    // Converter gráfico em imagem e gerar PDF
    setTimeout(() => {
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.style.width = '100%';
      img.style.maxWidth = '600px';
      img.style.display = 'block';
      img.style.margin = '0 auto';
      canvas.replaceWith(img);

      html2pdf()
        .set({
          margin: [5, 10, 5, 10],
          filename: `Relatorio_${String(num).padStart(3,'0')}_${ano}.pdf`,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(container)
        .save()
        .then(() => container.remove());
    }, 800);
  };
  document.body.appendChild(script);
}

// graficoResumo.js — gráfico horizontal moderno (ISSQN, TFLF, Auto de Infração, Outros)
// Requisitos: carregar Chart.js no HTML antes deste módulo:
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

export function gerarGraficoResumo(rows, options = {}) {
  // ===== Opções e defaults
  const {
    canvasId = 'graficoResumo',
    showValueLabels = true,           // mostra "R$ 0,00" ao lado das barras
    getTipo  = r => (r.descricaoResumida || r.tipoServico || '').toString(),
    getValor = r => Number(r.valor || 0),
    issKeywords   = ['lançamento de tributo', 'emissão de guia de issqn'],
    tflfKeywords  = ['apuração de tflf'],
    autoKeywords  = ['auto de infração'],
    colors = {
      issStart:   '#3b82f6', issEnd:   '#2563eb', // azul
      tflfStart:  '#22c55e', tflfEnd:  '#15803d', // verde
      autoStart:  '#fbbf24', autoEnd:  '#f59e0b', // amarelo/laranja
      outStart:   '#9ca3af', outEnd:   '#6b7280', // cinza
      axis:       '#4b5563',
      yTick:      '#111827',
      tooltipBg:  'rgba(17, 24, 39, 0.9)',
      tooltipTxt: '#e5e7eb'
    }
  } = options;

  // Garantir que Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não foi carregado. Adicione <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> antes deste módulo.');
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas #${canvasId} não encontrado.`);
    return;
  }

  // ===== Somatórios
  let totalISS = 0, totalTFLF = 0, totalAuto = 0, totalOutros = 0;

  const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  rows?.forEach(r => {
    const tipo  = norm(getTipo(r));
    const valor = getValor(r);

    if (issKeywords.some(k => tipo.includes(norm(k)))) totalISS  += valor;
    else if (tflfKeywords.some(k => tipo.includes(norm(k)))) totalTFLF += valor;
    else if (autoKeywords.some(k => tipo.includes(norm(k)))) totalAuto += valor;
    else totalOutros += valor;
  });

  // ===== Contexto e gradientes
  const ctx = canvas.getContext('2d');

  // Destrói gráfico anterior (por-canvas) se existir
  if (canvas._chartInstance) {
    canvas._chartInstance.destroy();
    canvas._chartInstance = null;
  }

  const gradISS  = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradISS.addColorStop(0, colors.issStart);
  gradISS.addColorStop(1, colors.issEnd);

  const gradTFLF = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradTFLF.addColorStop(0, colors.tflfStart);
  gradTFLF.addColorStop(1, colors.tflfEnd);

  const gradAuto = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradAuto.addColorStop(0, colors.autoStart);
  gradAuto.addColorStop(1, colors.autoEnd);

  const gradOut  = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradOut.addColorStop(0, colors.outStart);
  gradOut.addColorStop(1, colors.outEnd);

  // ===== Plugin simples para rótulos de valor na ponta das barras
  const valueLabelPlugin = {
    id: 'valueLabelPlugin',
    afterDatasetsDraw(chart) {
      if (!showValueLabels) return;
      const { ctx, chartArea, scales } = chart;
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      ctx.save();
      ctx.font = '600 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillStyle = colors.yTick;

      meta.data.forEach((bar, i) => {
        const val = dataset.data[i] || 0;
        const text = 'R$ ' + Number(val).toLocaleString('pt-BR');
        const x = Math.max(bar.x + 6, scales.x.left + 6);
        const y = bar.y + (bar.height ? bar.height / 2 : 0);
        const maxX = chartArea.right - 4;
        const measured = ctx.measureText(text).width;
        const drawX = Math.min(x, maxX - measured);
        ctx.fillText(text, drawX, y + 4);
      });

      ctx.restore();
    }
  };

  // ===== Criação do gráfico
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ISSQN', 'TFLF', 'Auto de Infração', 'Outros'],
      datasets: [{
        label: 'Valor arrecadado (R$)',
        data: [totalISS, totalTFLF, totalAuto, totalOutros],
        backgroundColor: [gradISS, gradTFLF, gradAuto, gradOut],
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: '#fff',
          bodyColor: colors.tooltipTxt,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: ctx => 'R$ ' + Number(ctx.parsed.x || 0).toLocaleString('pt-BR')
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            color: colors.axis,
            callback: v => 'R$ ' + Number(v).toLocaleString('pt-BR')
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.yTick, font: { weight: 600 } }
        }
      }
    },
    plugins: [valueLabelPlugin]
  });

  // Guarda a instância no canvas
  canvas._chartInstance = chart;

  // Retorna os totais caso queira exibir em outro lugar
  return { totalISS, totalTFLF, totalAuto, totalOutros };
}

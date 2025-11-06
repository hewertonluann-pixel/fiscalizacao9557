export function inicializarConversor(db, sess, addDoc, collection, serverTimestamp, renderMeus, showMsg) {
  const btnConverter = document.createElement('button');
  btnConverter.textContent = 'Converter texto copiado (planilha)';
  btnConverter.className = 'btn-ghost';
  document.querySelector('.card .hd').appendChild(btnConverter);

  // ===== MODAL DE PRÉVIA =====
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:none; align-items:center; justify-content:center; z-index:1000;
  `;
  modal.innerHTML = `
    <div style="background:#fff; border-radius:10px; max-width:950px; width:90%; padding:20px; max-height:80vh; overflow:auto; box-shadow:0 10px 30px rgba(0,0,0,0.3)">
      <h3>Pré-visualização dos lançamentos</h3>
      <p style="font-size:13px;color:#555">Confira os dados antes de salvar no Firestore.</p>
      <div id="prevTabela" style="overflow-x:auto; margin-top:10px;"></div>
      <div id="progInfo" style="font-size:13px;color:#333;margin-top:8px;display:none;text-align:right;">Iniciando...</div>
      <div id="progBar" style="margin-top:4px; height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden; display:none;">
        <div id="progFill" style="height:100%; width:0%; background:#2563eb; transition:width 0.2s"></div>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
        <button id="btnCancelarPrev" class="btn-ghost">Cancelar</button>
        <button id="btnConfirmarPrev">Confirmar e salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // ===== ELEMENTOS =====
  const tabelaDiv = modal.querySelector('#prevTabela');
  const btnCancelar = modal.querySelector('#btnCancelarPrev');
  const btnConfirmar = modal.querySelector('#btnConfirmarPrev');
  const bar = modal.querySelector('#progBar');
  const fill = modal.querySelector('#progFill');
  const info = modal.querySelector('#progInfo');
  btnCancelar.onclick = () => (modal.style.display = 'none');

  // ===== BOTÃO PRINCIPAL =====
  btnConverter.onclick = async () => {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) { showMsg('Nenhum texto copiado.', 'err'); return; }

    const linhas = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (linhas.length === 0) { showMsg('Nenhuma linha válida.', 'err'); return; }

    const anoAtual = new Date().getFullYear();
    const dados = [];

    for (const linha of linhas) {
      const partes = linha.split(/\t+/).map(p => p.trim());
      if (partes.length < 4) continue; // linha incompleta

      const dataBr = partes[0] || "";
      const [dia, mes] = dataBr.split("/");
      const dataISO = `${anoAtual}-${mes?.padStart(2, "0")}-${dia?.padStart(2, "0")}`;
      const empresa = partes[1] || "";
      const cnpj = partes[2] || "";

      let desc = "", qtd = 1, valor = 0, destino = "", resumo = "";

      // Colunas restantes (após CNPJ)
      const cols = partes.slice(3);

      // índice da quantidade
      const idxQtd = cols.findIndex(p => /^\d+$/.test(p));
      if (idxQtd >= 0) qtd = parseInt(cols[idxQtd], 10);

      // índice do valor (corrigido para formato brasileiro)
      const idxValor = cols.findIndex(p => /R?\$/.test(p));
      if (idxValor >= 0) {
        const raw = cols[idxValor]
          .replace(/[^\d,.-]/g, '') // remove R$, espaços e outros símbolos
          .replace(/\./g, '')       // remove pontos de milhar
          .replace(',', '.');       // troca vírgula decimal por ponto
        valor = parseFloat(raw) || 0;
      }

      // último campo é o resumo
      resumo = cols[cols.length - 1] || "";

      // penúltimo campo pode ser o destino (só se for curto e não contiver R$)
      if (cols.length >= 2) {
        const penult = cols[cols.length - 2];
        if (penult.length < 30 && !penult.includes("R$")) destino = penult;
      }

      // descrição: do início até a 1ª coluna numérica/R$
      const idxNum = cols.findIndex(p => /^\d+$/.test(p) || /R?\$/.test(p));
      if (idxNum > 0) desc = cols.slice(0, idxNum).join(" ");
      else desc = cols.slice(0, -2).join(" ");

      dados.push({
        data: dataISO,
        empresa,
        cnpj,
        descricao: desc.trim(),
        quantidade: qtd,
        valor,
        destino: destino.trim(),
        descricaoResumida: resumo.trim()
      });
    }

    // ===== PRÉVIA =====
    tabelaDiv.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6">
            <th>Data</th><th>Empresa</th><th>CNPJ</th>
            <th>Descrição</th><th>Qtd</th><th>Valor (R$)</th>
            <th>Destino</th><th>Resumo</th>
          </tr>
        </thead>
        <tbody>
          ${dados.map(d => `
            <tr>
              <td>${d.data}</td>
              <td>${d.empresa}</td>
              <td>${d.cnpj}</td>
              <td>${d.descricao}</td>
              <td style="text-align:center">${d.quantidade}</td>
              <td style="text-align:right;${d.valor === 0 ? 'color:#dc2626;font-weight:600;' : ''}">
                ${d.valor ? d.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}
              </td>
              <td>${d.destino || '-'}</td>
              <td>${d.descricaoResumida}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
    modal.style.display = 'flex';

    // ===== CONFIRMA E ENVIA =====
    btnConfirmar.onclick = async () => {
      bar.style.display = 'block';
      info.style.display = 'block';
      fill.style.width = '0%';
      let done = 0;

      for (const d of dados) {
        await addDoc(collection(db, 'lancamentos'), {
          usuario: sess.nome,
          data: d.data,
          empresa: d.empresa,
          cnpj: d.cnpj,
          descricao: d.descricao,
          quantidade: d.quantidade,
          valor: d.valor,
          destino: d.destino,
          descricaoResumida: d.descricaoResumida,
          criadoEm: serverTimestamp()
        });
        done++;
        const perc = (done / dados.length) * 100;
        fill.style.width = `${perc}%`;
        info.textContent = `Salvando ${done} de ${dados.length} lançamentos...`;
      }

      modal.style.display = 'none';
      showMsg(`${done} lançamentos salvos com sucesso.`, 'ok');
      renderMeus();
    };
  };
}

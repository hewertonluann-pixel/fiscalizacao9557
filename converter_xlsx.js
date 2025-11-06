export function inicializarConversor(db, sess, addDoc, collection, serverTimestamp, renderMeus, showMsg) {
  const btnConverter = document.createElement('button');
  btnConverter.textContent = 'Converter texto copiado (planilha)';
  btnConverter.className = 'btn-ghost';
  document.querySelector('.card .hd').appendChild(btnConverter);

  // Modal de prévia
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:none; align-items:center; justify-content:center; z-index:1000;
  `;
  modal.innerHTML = `
    <div style="background:#fff; border-radius:10px; max-width:900px; width:90%; padding:20px; max-height:80vh; overflow:auto; box-shadow:0 10px 30px rgba(0,0,0,0.3)">
      <h3>Pré-visualização dos lançamentos</h3>
      <p style="font-size:13px;color:#555">Confira os dados antes de salvar no Firestore.</p>
      <div id="prevTabela" style="overflow-x:auto; margin-top:10px;"></div>
      <div id="progBar" style="margin-top:8px; height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden; display:none;">
        <div id="progFill" style="height:100%; width:0%; background:#2563eb; transition:width 0.2s"></div>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
        <button id="btnCancelarPrev" class="btn-ghost">Cancelar</button>
        <button id="btnConfirmarPrev">Confirmar e salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const tabelaDiv = modal.querySelector('#prevTabela');
  const btnCancelar = modal.querySelector('#btnCancelarPrev');
  const btnConfirmar = modal.querySelector('#btnConfirmarPrev');
  const bar = modal.querySelector('#progBar');
  const fill = modal.querySelector('#progFill');
  btnCancelar.onclick = () => (modal.style.display = 'none');

  btnConverter.onclick = async () => {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) { showMsg('Nenhum texto copiado.', 'err'); return; }

    const linhas = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l);
    if (linhas.length === 0) { showMsg('Nenhuma linha válida.', 'err'); return; }

    const anoAtual = new Date().getFullYear();
    const dados = [];

    for (const linha of linhas) {
      const partes = linha.split(/\t+/);
      if (partes.length < 6) continue;
      const [dataBr, empresa, cnpj, desc, qtd, destinoPoss, tipoServ] = partes;
      const [dia, mes] = (dataBr||'').split('/');
      const dataISO = `${anoAtual}-${mes?.padStart(2,'0')}-${dia?.padStart(2,'0')}`;
      dados.push({
        data:dataISO, empresa:empresa?.trim()||'', cnpj:cnpj?.trim()||'',
        descricao:desc?.trim()||'', quantidade:parseInt(qtd||'1',10)||1,
        destino:(destinoPoss||'').trim(), descricaoResumida:(tipoServ||'').trim()
      });
    }

    tabelaDiv.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead><tr style="background:#f3f4f6">
          <th>Data</th><th>Empresa</th><th>CNPJ</th><th>Descrição</th><th>Qtd</th><th>Destino</th><th>Resumo</th>
        </tr></thead>
        <tbody>${dados.map(d=>`
          <tr><td>${d.data}</td><td>${d.empresa}</td><td>${d.cnpj}</td><td>${d.descricao}</td>
          <td>${d.quantidade}</td><td>${d.destino||'-'}</td><td>${d.descricaoResumida}</td></tr>`).join('')}
        </tbody>
      </table>`;
    modal.style.display = 'flex';

    btnConfirmar.onclick = async () => {
      bar.style.display='block';
      fill.style.width='0%';
      let done=0;
      for(const d of dados){
        await addDoc(collection(db,'lancamentos'), {
          usuario:sess.nome, ...d, valor:0, criadoEm:serverTimestamp()
        });
        done++;
        fill.style.width=`${(done/dados.length)*100}%`;
      }
      modal.style.display='none';
      showMsg(`${done} lançamentos salvos com sucesso.`, 'ok');
      renderMeus();
    };
  };
}

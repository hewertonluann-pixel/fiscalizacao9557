// ======= CONVERSOR DE TABELA XLSX PARA LANÇAMENTOS =======
// Compatível com fiscal.html (2025-11)

export function inicializarConversor(db, sess, addDoc, collection, serverTimestamp, renderMeus, showMsg) {
  // 🔘 Cria botão principal
  const btnConverter = document.createElement('button');
  btnConverter.textContent = 'Converter texto copiado (planilha)';
  btnConverter.className = 'btn-ghost';
  document.querySelector('.card .hd').appendChild(btnConverter);

  // 🔲 Cria modal de pré-visualização
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:none; align-items:center; justify-content:center; z-index:1000;
  `;
  modal.innerHTML = `
    <div style="background:#fff; border-radius:10px; max-width:900px; width:90%; padding:20px; max-height:80vh; overflow:auto; box-shadow:0 10px 30px rgba(0,0,0,0.3)">
      <h3 style="margin-top:0">Pré-visualização dos lançamentos</h3>
      <p style="font-size:13px; color:#555">Confirme antes de salvar. Verifique se os campos foram interpretados corretamente.</p>
      <div id="prevTabela" style="overflow-x:auto; margin-top:12px;"></div>
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

  btnCancelar.onclick = () => (modal.style.display = 'none');

  // 🔄 Conversão principal
  btnConverter.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showMsg('Nenhum texto copiado.', 'err');
        return;
      }

      const linhas = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (linhas.length === 0) {
        showMsg('Nenhuma linha válida encontrada.', 'err');
        return;
      }

      const anoAtual = new Date().getFullYear();
      const dados = [];

      for (const linha of linhas) {
        const partes = linha.split(/\t+/);
        if (partes.length < 6) continue;

        const [dataBr, empresa, cnpj, desc, qtd, destinoPoss, tipoServ] = partes;
        if (!dataBr || !tipoServ) continue;

        const [dia, mes] = dataBr.split('/');
        const dataISO = `${anoAtual}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

        dados.push({
          data: dataISO,
          empresa: (empresa || '').trim(),
          cnpj: (cnpj || '').trim(),
          descricao: (desc || '').trim(),
          quantidade: parseInt(qtd || '1', 10) || 1,
          destino: (destinoPoss && destinoPoss.trim()) || '',
          descricaoResumida: (tipoServ || '').trim()
        });
      }

      if (dados.length === 0) {
        showMsg('Nenhuma linha com formato válido.', 'err');
        return;
      }

      // ⚠️ Alerta se colou muitas linhas
      if (dados.length > 200) {
        if (!confirm(`Você colou ${dados.length} linhas. Isso pode levar um tempo. Deseja continuar?`))
          return;
      }

      // Mostra tabela de prévia
      const html = `
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead style="background:#f3f4f6;">
            <tr>
              <th style="padding:6px; border-bottom:1px solid #ddd;">Data</th>
              <th style="padding:6px; border-bottom:1px solid #ddd;">Empresa</th>
              <th style="padding:6px; border-bottom:1px solid #ddd;">CNPJ/CPF</th>
              <th style="padding:6px; border-bottom:1px solid #ddd;">Descrição</th>
              <th style="padding:6px; border-bottom:1px solid #ddd;">Qtd</th>
              <th style="padding:6px; border-bottom:1px solid #ddd;">Destino</th>
              <th style="padding:6px; border-bottom:1px solid #ddd;">Resumo</th>
            </tr>
          </thead>
          <tbody>
            ${dados.map(d => `
              <tr>
                <td style="padding:6px; border-bottom:1px solid #eee;">${d.data}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;">${d.empresa}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;">${d.cnpj}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;">${d.descricao}</td>
                <td style="padding:6px; border-bottom:1px solid #eee; text-align:center;">${d.quantidade}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;">${d.destino || '-'}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;">${d.descricaoResumida}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
      tabelaDiv.innerHTML = html;
      modal.style.display = 'flex';

      // 🔘 Confirma e envia ao Firestore
      btnConfirmar.onclick = async () => {
        modal.style.display = 'none';
        let contador = 0;

        for (const d of dados) {
          await addDoc(collection(db, 'lancamentos'), {
            usuario: sess.nome,
            data: d.data,
            empresa: d.empresa,
            cnpj: d.cnpj,
            descricao: d.descricao,
            quantidade: d.quantidade,
            valor: 0,
            destino: d.destino,
            descricaoResumida: d.descricaoResumida,
            criadoEm: serverTimestamp()
          });
          contador++;
        }

        showMsg(`${contador} lançamentos adicionados com sucesso.`, 'ok');
        renderMeus();
      };

    } catch (e) {
      console.error(e);
      showMsg('Erro ao converter texto copiado.', 'err');
    }
  };
}

import { collection, query, where, orderBy, getDocs, deleteDoc, doc } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export function inicializarTabela(db, sess, numberToBRL, showMsg) {

  async function renderMeus() {
    if (!sess) return;
    const q = query(collection(db, 'lancamentos'), where('usuario', '==', sess.nome), orderBy('data', 'desc'));
    const snap = await getDocs(q);
    const tbody = document.querySelector('#tab tbody');
    tbody.innerHTML = '';
    let soma = 0;

    snap.forEach(docSnap => {
      const r = docSnap.data();
      const [y, mm, dd] = (r.data || '').split('-');
      if (window.anoAtivo && parseInt(y) != window.anoAtivo) return;
      if (window.mesAtivo && parseInt(mm) != window.mesAtivo) return;
      soma += Number(r.valor || 0);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dd}-${mm}-${y}</td>
        <td>${r.empresa || ''}</td>
        <td>${r.cnpj || ''}</td>
        <td>${r.descricao || ''}</td>
        <td>${r.quantidade || 0}</td>
        <td>${numberToBRL(r.valor)}</td>
        <td>${r.destino || ''}</td>
        <td>${r.descricaoResumida || ''}</td>
        <td style="white-space:nowrap">
          <button class="act" title="Excluir" data-del="${docSnap.id}">🗑️</button>
        </td>`;
      tbody.appendChild(tr);
    });

    document.querySelector('#tfootTotal').textContent = `Total do mês: ${numberToBRL(soma)}`;
    document.querySelector('#totalMes').textContent = `Total filtrado: ${numberToBRL(soma)}`;

    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('Excluir este lançamento?')) {
          await deleteDoc(doc(db, 'lancamentos', btn.getAttribute('data-del')));
          showMsg('Lançamento excluído.', 'ok');
          renderMeus();
        }
      };
    });
  }

  return renderMeus;
}

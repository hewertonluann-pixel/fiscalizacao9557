// usuarios.js — CRUD de usuários (Gerente)
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export function inicializarUsuarios(db) {
  const $ = s => document.querySelector(s);
  const msg = (t, cls='ok')=>{
    const el=$('#msg'); el.textContent=t; el.className='msg '+cls;
    el.style.display='block'; setTimeout(()=>el.style.display='none',2500);
  };

  const tb = $('#tabUsers tbody');
  const modal = $('#modalUser');
  let editId = null;

  async function carregarUsuarios(){
    const snap = await getDocs(collection(db,'usuarios'));
    tb.innerHTML='';
    snap.forEach(d=>{
      const u=d.data();
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${u.nome}</td><td>${u.tipo}</td><td>${u.senha}</td>
        <td style="white-space:nowrap">
          <button class="link" data-e="${d.id}">✏️</button>
          <button class="link" data-x="${d.id}" style="color:#dc2626">❌</button>
        </td>`;
      tb.appendChild(tr);
    });

    tb.querySelectorAll('[data-e]').forEach(b=>{
      b.onclick=async()=>{
        const id=b.getAttribute('data-e');
        const all=await getDocs(query(collection(db,'usuarios'), where('__name__','==',id)));
        if(!all.empty){
          const u=all.docs[0].data();
          $('#uNome').value=u.nome;
          $('#uSenha').value=u.senha;
          $('#uTipo').value=u.tipo;
          editId=id;
          $('#modalTitulo').textContent='Editar Usuário';
          modal.style.display='flex';
        }
      };
    });

    tb.querySelectorAll('[data-x]').forEach(b=>{
      b.onclick=async()=>{
        const id=b.getAttribute('data-x');
        if(confirm('Excluir este usuário?')){
          await deleteDoc(doc(db,'usuarios',id));
          msg('Usuário removido','ok');
          carregarUsuarios();
        }
      };
    });
  }

  $('#btnNovoUser').onclick=()=>{
    editId=null;
    $('#uNome').value='';
    $('#uSenha').value='';
    $('#uTipo').value='fiscal';
    $('#modalTitulo').textContent='Novo Usuário';
    modal.style.display='flex';
  };

  $('#btnCancelarUser').onclick=()=>modal.style.display='none';

  $('#btnSalvarUser').onclick=async()=>{
    const nome=$('#uNome').value.trim();
    const senha=$('#uSenha').value.trim();
    const tipo=$('#uTipo').value;
    if(!nome || !senha){ msg('Preencha nome e senha','err'); return; }

    try{
      if(editId){
        await updateDoc(doc(db,'usuarios',editId),{nome,senha,tipo});
        msg('Usuário atualizado','ok');
      }else{
        await addDoc(collection(db,'usuarios'),{nome,senha,tipo,nomeLower:nome.toLowerCase()});
        msg('Usuário adicionado','ok');
      }
      modal.style.display='none';
      carregarUsuarios();
    }catch(e){
      console.error(e);
      msg('Erro ao salvar','err');
    }
  };

  carregarUsuarios();
}

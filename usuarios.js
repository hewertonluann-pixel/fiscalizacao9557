// usuarios.js — CRUD de usuários via Google OAuth (Gerente)
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
    const snap = await getDocs(collection(db,'usuarios_autorizados'));
    tb.innerHTML='';
    snap.forEach(d=>{
      const u=d.data();
      const statusBadge = u.ativo 
        ? '<span class="status-badge ativo">✔️ Ativo</span>' 
        : '<span class="status-badge inativo">❌ Inativo</span>';
      
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${u.nome||'---'}</td>
        <td style="font-family:monospace;font-size:12px">${u.email||'---'}</td>
        <td><span style="text-transform:capitalize;font-weight:600;color:${u.tipo==='gerente'?'#2563eb':'#059669'}">${u.tipo||'---'}</span></td>
        <td>${statusBadge}</td>
        <td style="white-space:nowrap">
          <button class="link" data-e="${d.id}" style="cursor:pointer;background:none;border:none;font-size:16px">✏️</button>
          <button class="link" data-x="${d.id}" style="cursor:pointer;background:none;border:none;font-size:16px;color:#dc2626">❌</button>
        </td>`;
      tb.appendChild(tr);
    });

    tb.querySelectorAll('[data-e]').forEach(b=>{
      b.onclick=async()=>{
        const id=b.getAttribute('data-e');
        const docSnap = await getDocs(query(collection(db,'usuarios_autorizados'), where('__name__','==',id)));
        if(!docSnap.empty){
          const u=docSnap.docs[0].data();
          $('#uNome').value=u.nome||'';
          $('#uEmail').value=u.email||'';
          $('#uTipo').value=u.tipo||'fiscal';
          $('#uAtivo').value=String(u.ativo !== false);
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
          await deleteDoc(doc(db,'usuarios_autorizados',id));
          msg('Usuário removido','ok');
          carregarUsuarios();
        }
      };
    });
  }

  $('#btnNovoUser').onclick=()=>{
    editId=null;
    $('#uNome').value='';
    $('#uEmail').value='';
    $('#uTipo').value='fiscal';
    $('#uAtivo').value='true';
    $('#modalTitulo').textContent='Novo Usuário';
    modal.style.display='flex';
  };

  $('#btnCancelarUser').onclick=()=>modal.style.display='none';

  $('#btnSalvarUser').onclick=async()=>{
    const nome=$('#uNome').value.trim();
    const email=$('#uEmail').value.trim().toLowerCase();
    const tipo=$('#uTipo').value;
    const ativo = $('#uAtivo').value === 'true';
    
    if(!nome || !email){ msg('Preencha nome e email','err'); return; }
    
    // Validação de email
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      msg('Email inválido','err');
      return;
    }

    try{
      if(editId){
        await updateDoc(doc(db,'usuarios_autorizados',editId),{
          nome,
          email,
          tipo,
          ativo
        });
        msg('Usuário atualizado','ok');
      }else{
        // Verifica se já existe
        const existente = await getDocs(query(collection(db,'usuarios_autorizados'), where('email','==',email)));
        if(!existente.empty){
          msg('Email já cadastrado','err');
          return;
        }
        
        await addDoc(collection(db,'usuarios_autorizados'),{
          nome,
          email,
          tipo,
          ativo: true,
          dataCriacao: new Date().toISOString()
        });
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

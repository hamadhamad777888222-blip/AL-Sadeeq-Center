// app.js - تحديث لعرض الشعار، أيقونات التبويبات ذات ألوان، وتحكم واضح بالثيم (light/dark)
// يتضمن الوظائف السابقة مع احتفاظ بالتحسينات الجديدة.

const DB_KEY = 'msd_al_sadeq_db_v4';
function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw) return {halqat:[], students:[], results:[]};
  try{ return JSON.parse(raw);}catch(e){ return {halqat:[], students:[], results:[]};}
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

let db = loadDB();
if(db.halqat.length===0 && db.students.length===0){
  db.halqat = [
    {id: 'h1', name: 'حلقة الصباح', teacher: 'الأستاذ أحمد'},
    {id: 'h2', name: 'حلقة المساء', teacher: 'الأستاذة فاطمة'}
  ];
  db.students = [
    {id: 's1', name: 'علي محمد', age: 12, phone: '050000111', halqaId: 'h1'},
    {id: 's2', name: 'سارة خالد', age: 14, phone: '050000222', halqaId: 'h1'},
    {id: 's3', name: 'خالد عمر', age: 13, phone: '050000333', halqaId: 'h2'}
  ];
  db.results = [];
  saveDB(db);
}

// Elements
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const halqatCardsWrap = document.getElementById('halqatCards');
const halqatTableBody = document.querySelector('#halqatTable tbody');
const filterHalqa = document.getElementById('filterHalqa');
const studentsTableBody = document.querySelector('#studentsTable tbody');
const studentForResult = document.getElementById('studentForResult');
const singleResultForm = document.getElementById('singleResultForm');
const bulkCsvTextarea = document.getElementById('bulkCsv');
const bulkParseBtn = document.getElementById('bulkParseBtn');
const bulkFile = document.getElementById('bulkFile');
const reportHalqa = document.getElementById('reportHalqa');
const reportPreview = document.getElementById('reportPreview');
const generateReportBtn = document.getElementById('generateReport');
const saveReportPdfBtn = document.getElementById('saveReportPdf');
const chartsHalqa = document.getElementById('chartsHalqa');
const refreshChartsBtn = document.getElementById('refreshCharts');

const exportAllBtn = document.getElementById('exportAllBtn');
const importFile = document.getElementById('importFile');
const exportAllBtnDash = document.getElementById('exportAllBtnDash');
const importFileDash = document.getElementById('importFileDash');

const toggleThemeBtn = document.getElementById('toggleTheme');
const themeLabel = document.getElementById('themeLabel');

// Dashboard
const statStudents = document.getElementById('statStudents');
const statHalqat = document.getElementById('statHalqat');
const statProgress = document.getElementById('statProgress');
const chartLevelDash = document.getElementById('chartLevelDash');
const chartProgressDash = document.getElementById('chartProgressDash');

// Tab navigation
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=> {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.tab;
    tabContents.forEach(tc => tc.id===t ? tc.classList.add('active') : tc.classList.remove('active'));
  });
});
document.querySelectorAll('.goto').forEach(b=>{
  b.addEventListener('click', ()=> {
    const target = b.dataset.tabTarget;
    document.querySelector(`.tab-btn[data-tab="${target}"]`).click();
  });
});

// theme - explicit 'light' or 'dark' to control colors and ensure text color change
function setTheme(name){
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem('msd_theme', name);
  themeLabel.textContent = name === 'dark' ? 'وضع داكن' : 'وضع فاتح';

  // For better contrast: ensure all main text in light theme is black
  if(name === 'light'){
    document.documentElement.style.setProperty('--text', '#000');
  } else {
    document.documentElement.style.setProperty('--text', '');
  }
}
toggleThemeBtn?.addEventListener('click', ()=>{
  const cur = localStorage.getItem('msd_theme') || 'light';
  setTheme(cur === 'dark' ? 'light' : 'dark');
});
setTheme(localStorage.getItem('msd_theme') || 'light');

// helper id generator
function genId(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }

// render halqat cards and table
function renderHalqat(){
  halqatCardsWrap.innerHTML = '';
  db.halqat.forEach(h=>{
    const count = db.students.filter(s=>s.halqaId===h.id).length;
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h4>${h.name}</h4><p>أستاذ الحلقة: ${h.teacher || '-'}</p><p>عدد الطلاب: ${count}</p>
      <div style="display:flex;gap:8px;justify-content:flex-start;margin-top:8px">
        <button data-id="${h.id}" class="edit-halqa secondary">تعديل</button>
        <button data-id="${h.id}" class="delete-halqa" style="background:var(--danger)">حذف</button>
        <button data-id="${h.id}" class="open-halqa">فتح</button>
      </div>`;
    halqatCardsWrap.appendChild(card);
  });

  halqatTableBody.innerHTML = '';
  db.halqat.forEach(h=>{
    const count = db.students.filter(s=>s.halqaId===h.id).length;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${h.name}</td><td>${h.teacher||'-'}</td><td>${count}</td>
      <td style="text-align:left">
        <button data-id="${h.id}" class="edit-halqa secondary">تعديل</button>
        <button data-id="${h.id}" class="delete-halqa" style="background:var(--danger)">حذف</button>
        <button data-id="${h.id}" class="open-halqa">فتح</button>
      </td>`;
    halqatTableBody.appendChild(tr);
  });

  populateHalqaSelects();
}

// populate selects
function populateHalqaSelects(){
  const selects = [filterHalqa, studentForResult, reportHalqa, chartsHalqa];
  selects.forEach(sel=>{
    if(!sel) return;
    const val = sel.value || '';
    sel.innerHTML = '<option value="">-- الكل --</option>';
    db.halqat.forEach(h=>{
      const opt = document.createElement('option');
      opt.value = h.id; opt.textContent = h.name;
      sel.appendChild(opt);
    });
    sel.value = val;
  });
}

// event delegation
document.addEventListener('click', (e)=>{
  if(e.target.matches('#addHalqaBtn')){
    openHalqaModal();
  } else if(e.target.matches('.edit-halqa')){
    openHalqaModal(e.target.dataset.id);
  } else if(e.target.matches('.delete-halqa')){
    const id = e.target.dataset.id;
    if(confirm('هل تريد حذف هذه الحلقة؟ سيبقى الطلاب مرتبطين بدون حلقة.')) {
      db.halqat = db.halqat.filter(h=>h.id!==id);
      saveDB(db); renderAll();
    }
  } else if(e.target.matches('.open-halqa')){
    const id = e.target.dataset.id;
    document.querySelector('.tab-btn[data-tab="students"]').click();
    filterHalqa.value = id;
    renderStudents();
  } else if(e.target.matches('.view-results')){
    openResultsModal(e.target.dataset.id);
  }
});

// modal helpers
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
closeModal.addEventListener('click', ()=> modal.classList.add('hidden'));

function openHalqaModal(id=null){
  const halqa = db.halqat.find(h=>h.id===id) || {name:'', teacher:''};
  modalContent.innerHTML = `
    <h3>${id ? 'تعديل حلقة' : 'إضافة حلقة'}</h3>
    <form id="halqaForm">
      <label>اسم الحلقة: <input name="name" required value="${halqa.name}"/></label>
      <label>أستاذ الحلقة: <input name="teacher" value="${halqa.teacher || ''}"/></label>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button type="submit">${id ? 'حفظ' : 'إضافة'}</button>
        <button type="button" id="cancelHalqa" class="secondary">إلغاء</button>
      </div>
    </form>`;
  modal.classList.remove('hidden');
  document.getElementById('cancelHalqa').addEventListener('click', ()=> modal.classList.add('hidden'));
  document.getElementById('halqaForm').addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const name = fd.get('name').trim();
    const teacher = fd.get('teacher').trim();
    if(id){
      const h = db.halqat.find(x=>x.id===id);
      h.name = name; h.teacher = teacher;
    } else {
      db.halqat.push({id: genId('h'), name, teacher});
    }
    saveDB(db); renderAll(); modal.classList.add('hidden');
  }, {once:true});
}

// Students
function renderStudents(){
  const filter = filterHalqa.value;
  studentsTableBody.innerHTML = '';
  const students = db.students.filter(s=>!filter || s.halqaId===filter);
  students.forEach(s=>{
    const halqaName = db.halqat.find(h=>h.id===s.halqaId)?.name || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.age||''}</td><td>${s.phone||''}</td><td>${halqaName}</td>
      <td style="text-align:left">
        <button data-id="${s.id}" class="edit-student secondary">تعديل</button>
        <button data-id="${s.id}" class="delete-student" style="background:var(--danger)">حذف</button>
        <button data-id="${s.id}" class="view-results">نتائجه</button>
      </td>`;
    studentsTableBody.appendChild(tr);
  });

  if(studentForResult){
    studentForResult.innerHTML = '<option value="">-- اختر طالب --</option>';
    db.students.forEach(s=>{
      const opt = document.createElement('option');
      opt.value = s.id; opt.textContent = `${s.name} (${db.halqat.find(h=>h.id===s.halqaId)?.name||''})`;
      studentForResult.appendChild(opt);
    });
  }
}
document.addEventListener('click', (e)=>{
  if(e.target.matches('#addStudentBtn') || e.target.matches('#addStudent')){
    openStudentModal();
  } else if(e.target.matches('.edit-student')){
    openStudentModal(e.target.dataset.id);
  } else if(e.target.matches('.delete-student')){
    const id = e.target.dataset.id;
    if(confirm('هل تريد حذف هذا الطالب؟ سيتم حذف نتائجه أيضاً.')){
      db.students = db.students.filter(s=>s.id!==id);
      db.results = db.results.filter(r=>r.studentId!==id);
      saveDB(db); renderAll();
    }
  }
});
function openStudentModal(id=null){
  const st = db.students.find(s=>s.id===id) || {name:'', age:'', phone:'', halqaId:''};
  const halqaOpts = db.halqat.map(h=>`<option value="${h.id}" ${h.id===st.halqaId ? 'selected':''}>${h.name}</option>`).join('');
  modalContent.innerHTML = `
    <h3>${id ? 'تعديل طالب' : 'إضافة طالب'}</h3>
    <form id="studentForm">
      <label>الاسم: <input name="name" required value="${st.name}"/></label>
      <label>العمر: <input name="age" type="number" value="${st.age||''}"/></label>
      <label>الهاتف: <input name="phone" value="${st.phone||''}"/></label>
      <label>الحلقة: <select name="halqaId">${halqaOpts}</select></label>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button type="submit">${id ? 'حفظ' : 'إضافة'}</button>
        <button type="button" id="cancelStudent" class="secondary">إلغاء</button>
      </div>
    </form>`;
  modal.classList.remove('hidden');
  document.getElementById('cancelStudent').addEventListener('click', ()=> modal.classList.add('hidden'));
  document.getElementById('studentForm').addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = {
      name: fd.get('name').trim(),
      age: fd.get('age') ? Number(fd.get('age')) : '',
      phone: fd.get('phone').trim(),
      halqaId: fd.get('halqaId')
    };
    if(id){
      const s = db.students.find(x=>x.id===id);
      Object.assign(s, data);
    } else {
      db.students.push(Object.assign({id: genId('s')}, data));
    }
    saveDB(db); renderAll(); modal.classList.add('hidden');
  }, {once:true});
}

// Results handling (add/edit, numeric calc)
singleResultForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const sid = document.getElementById('studentForResult').value;
  if(!sid){ alert('اختر طالباً'); return; }

  const rec = {
    id: genId('r'),
    studentId: sid,
    date: new Date().toISOString().slice(0,10),

    hifzFrom: Number(document.getElementById('hifzFrom').value||0),
    hifzTo: Number(document.getElementById('hifzTo').value||0),
    textHifz: document.getElementById('textHifz').value.trim(),

    talaawaFrom: Number(document.getElementById('talaawaFrom').value||0),
    talaawaTo: Number(document.getElementById('talaawaTo').value||0),
    textTalaawa: document.getElementById('textTalaawa').value.trim(),

    mrvFrom: Number(document.getElementById('mrvFrom').value||0),
    mrvTo: Number(document.getElementById('mrvTo').value||0),
    textMrv: document.getElementById('textMrv').value.trim(),

    scoreHifz: Number(document.getElementById('scoreHifz').value || 0),
    scoreTalaawa: Number(document.getElementById('scoreTalaawa').value || 0),
    scoreTajweed: Number(document.getElementById('scoreTajweed').value || 0)
  };

  const numericProvided = (rec.scoreHifz || rec.scoreTalaawa || rec.scoreTajweed);
  if(numericProvided){
    rec.total = rec.scoreHifz + rec.scoreTalaawa + rec.scoreTajweed;
    rec.avg = +(rec.total / 3).toFixed(1);
    rec.grade = computeGrade(rec.avg);
  } else { rec.total = null; rec.avg = null; rec.grade = null; }

  db.results.push(rec);
  saveDB(db);
  alert('تم حفظ النتيجة');
  singleResultForm.reset();
  renderAll();
});

// compute grade
function computeGrade(avg){
  if(avg === null || avg === undefined) return '-';
  if(avg >= 85) return 'ممتاز';
  if(avg >= 70) return 'جيد جداً';
  if(avg >= 50) return 'جيد';
  return 'ضعيف';
}

// bulk import
bulkParseBtn?.addEventListener('click', ()=> {
  const txt = bulkCsvTextarea.value.trim();
  if(!txt){ alert('أدخل نص CSV'); return; }
  const parsed = Papa.parse(txt, {delimiter:',', skipEmptyLines:true}).data;
  let added=0;
  parsed.forEach(row=>{
    if(row.length < 1) return;
    const sid = row[0].toString().trim();
    if(!db.students.find(s=>s.id===sid)) return;
    const rec = {
      id: genId('r'),
      studentId: sid,
      date: new Date().toISOString().slice(0,10),
      textHifz: row[1] || '',
      textTalaawa: row[2] || '',
      textTajweed: row[3] || '',
      hifzFrom: Number(row[4]||0), hifzTo: Number(row[5]||0),
      talaawaFrom: Number(row[6]||0), talaawaTo: Number(row[7]||0),
      mrvFrom: Number(row[8]||0), mrvTo: Number(row[9]||0),
      scoreHifz: Number(row[10]||0), scoreTalaawa: Number(row[11]||0), scoreTajweed: Number(row[12]||0)
    };
    if(rec.scoreHifz || rec.scoreTalaawa || rec.scoreTajweed){
      rec.total = rec.scoreHifz + rec.scoreTalaawa + rec.scoreTajweed;
      rec.avg = +(rec.total / 3).toFixed(1);
      rec.grade = computeGrade(rec.avg);
    }
    db.results.push(rec); added++;
  });
  saveDB(db); alert(`تمت إضافة ${added} نتيجة`); bulkCsvTextarea.value=''; renderAll();
});
bulkFile?.addEventListener('change', (e)=>{
  const file = e.target.files[0]; if(!file) return;
  Papa.parse(file, {complete(res){
    let added=0;
    res.data.forEach(row=>{
      if(row.length < 1) return;
      const sid = row[0].toString().trim();
      if(!db.students.find(s=>s.id===sid)) return;
      const rec = {
        id: genId('r'),
        studentId: sid,
        date: new Date().toISOString().slice(0,10),
        textHifz: row[1] || '',
        textTalaawa: row[2] || '',
        textTajweed: row[3] || '',
        hifzFrom: Number(row[4]||0), hifzTo: Number(row[5]||0),
        talaawaFrom: Number(row[6]||0), talaawaTo: Number(row[7]||0),
        mrvFrom: Number(row[8]||0), mrvTo: Number(row[9]||0),
        scoreHifz: Number(row[10]||0), scoreTalaawa: Number(row[11]||0), scoreTajweed: Number(row[12]||0)
      };
      if(rec.scoreHifz || rec.scoreTalaawa || rec.scoreTajweed){
        rec.total = rec.scoreHifz + rec.scoreTalaawa + rec.scoreTajweed;
        rec.avg = +(rec.total / 3).toFixed(1);
        rec.grade = computeGrade(rec.avg);
      }
      db.results.push(rec); added++;
    });
    saveDB(db); alert(`تمت إضافة ${added} نتيجة`); renderAll();
  }});
});

// View & edit student results
function openResultsModal(studentId){
  const student = db.students.find(s=>s.id===studentId);
  const results = db.results.filter(r=>r.studentId===studentId);
  let rowsHtml = results.map(r=>{
    return `<tr data-rid="${r.id}">
      <td>${r.date}</td>
      <td>${r.hifzFrom||'-'} - ${r.hifzTo||'-'}</td>
      <td>${escapeHtml(r.textHifz||'-')}</td>
      <td>${r.talaawaFrom||'-'} - ${r.talaawaTo||'-'}</td>
      <td>${escapeHtml(r.textTalaawa||'-')}</td>
      <td>${r.mrvFrom||'-'} - ${r.mrvTo||'-'}</td>
      <td>${escapeHtml(r.textMrv||'-')}</td>
      <td>${r.scoreHifz||'-'}</td>
      <td>${r.scoreTalaawa||'-'}</td>
      <td>${r.scoreTajweed||'-'}</td>
      <td>${r.total||'-'}</td>
      <td>${r.avg||'-'}</td>
      <td>${r.grade||'-'}</td>
      <td>
        <button class="edit-result" data-id="${r.id}">تعديل</button>
        <button class="delete-result" data-id="${r.id}">حذف</button>
      </td>
    </tr>`;
  }).join('');

  if(rowsHtml === '') rowsHtml = `<tr><td colspan="14">لا توجد نتائج لهذا الطالب</td></tr>`;

  modalContent.innerHTML = `
    <h3>نتائج ${student?.name || ''}</h3>
    <div style="overflow:auto"><table style="width:100%;font-size:13px;border-collapse:collapse">
      <thead><tr>
        <th>التاريخ</th><th>الحفظ</th><th>نص الحفظ</th><th>التلاوة</th><th>نص التلاوة</th><th>المراجعة</th><th>نص المراجعة</th>
        <th>حفظ</th><th>تلاوة</th><th>تجويد</th><th>المجموع</th><th>المعدل</th><th>التقدير</th><th>إجراءات</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table></div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button id="addNewResultForStudent" data-st="${studentId}">إضافة نتيجة جديدة</button>
      <button id="closeResultsModal" class="secondary">إغلاق</button>
    </div>
  `;
  modal.classList.remove('hidden');

  document.getElementById('closeResultsModal').addEventListener('click', ()=> modal.classList.add('hidden'), {once:true});
  document.getElementById('addNewResultForStudent').addEventListener('click', (ev)=>{
    modal.classList.add('hidden');
    document.querySelector('.tab-btn[data-tab="results"]').click();
    setTimeout(()=> { document.getElementById('studentForResult').value = ev.target.dataset.st; }, 200);
  }, {once:true});
}

// edit/delete result
document.addEventListener('click', (e)=>{
  if(e.target.matches('.edit-result')){
    const rid = e.target.dataset.id;
    openEditResultModal(rid);
  } else if(e.target.matches('.delete-result')){
    const rid = e.target.dataset.id;
    if(confirm('حذف النتيجة؟')){
      db.results = db.results.filter(r=>r.id!==rid);
      saveDB(db); renderAll();
      modal.classList.add('hidden');
    }
  }
});

function openEditResultModal(rid){
  const r = db.results.find(x=>x.id===rid);
  if(!r) return alert('النتيجة غير موجودة');
  modalContent.innerHTML = `
    <h3>تعديل نتيجة (${r.date})</h3>
    <form id="editResultForm">
      <label>نص الحفظ: <textarea name="textHifz" rows="2">${r.textHifz || ''}</textarea></label>
      <label>نص التلاوة: <textarea name="textTalaawa" rows="2">${r.textTalaawa || ''}</textarea></label>
      <label>نص المراجعة: <textarea name="textMrv" rows="2">${r.textMrv || ''}</textarea></label>
      <div class="group-row">
        <label>درجة الحفظ: <input name="scoreHifz" type="number" value="${r.scoreHifz||0}" /></label>
        <label>درجة التلاوة: <input name="scoreTalaawa" type="number" value="${r.scoreTalaawa||0}" /></label>
        <label>درجة التجويد: <input name="scoreTajweed" type="number" value="${r.scoreTajweed||0}" /></label>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button type="submit">حفظ</button>
        <button type="button" id="cancelEditResult" class="secondary">إلغاء</button>
      </div>
    </form>
  `;
  modal.classList.remove('hidden');
  document.getElementById('cancelEditResult').addEventListener('click', ()=> modal.classList.add('hidden'));
  document.getElementById('editResultForm').addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const fd = new FormData(ev.target);
    r.textHifz = fd.get('textHifz').trim();
    r.textTalaawa = fd.get('textTalaawa').trim();
    r.textMrv = fd.get('textMrv').trim();
    r.scoreHifz = Number(fd.get('scoreHifz')||0);
    r.scoreTalaawa = Number(fd.get('scoreTalaawa')||0);
    r.scoreTajweed = Number(fd.get('scoreTajweed')||0);
    if(r.scoreHifz || r.scoreTalaawa || r.scoreTajweed){
      r.total = r.scoreHifz + r.scoreTalaawa + r.scoreTajweed;
      r.avg = +(r.total / 3).toFixed(1);
      r.grade = computeGrade(r.avg);
    } else {
      r.total = null; r.avg = null; r.grade = null;
    }
    saveDB(db);
    alert('تم حفظ التعديل');
    modal.classList.add('hidden');
    renderAll();
  }, {once:true});
}

// Reports
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function generateReportForHalqa(halqaId){
  const halqa = db.halqat.find(h=>h.id===halqaId);
  if(!halqa) return '<p>لم يتم اختيار حلقة.</p>';
  const students = db.students.filter(s=>s.halqaId===halqaId);
  const rows = students.map(s=>{
    const rList = db.results.filter(r=>r.studentId===s.id);
    const last = rList[rList.length-1] || {};
    return `<tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${last.hifzFrom||'-'} - ${last.hifzTo||'-'}</td>
      <td>${last.mrvFrom||'-'} - ${last.mrvTo||'-'}</td>
      <td>${escapeHtml(last.textHifz||'-')}</td>
      <td>${escapeHtml(last.textTalaawa||'-')}</td>
      <td>${escapeHtml(last.textMrv||'-')}</td>
      <td>${last.scoreHifz || '-'}</td>
      <td>${last.scoreTalaawa || '-'}</td>
      <td>${last.scoreTajweed || '-'}</td>
      <td>${last.total || '-'}</td>
      <td>${last.avg || '-'}</td>
      <td>${last.grade || '-'}</td>
    </tr>`;
  }).join('');

  const html = `
    <div class="report" style="direction:rtl">
      <h2 style="text-align:center">تقرير شهري - ${escapeHtml(halqa.name)}</h2>
      <p>أستاذ الحلقة: ${escapeHtml(halqa.teacher||'-')}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead>
          <tr>
            <th>اسم الطالب</th>
            <th>الحفظ (من-إلى)</th>
            <th>المراجعة (من-إلى)</th>
            <th>نص الحفظ</th>
            <th>نص التلاوة</th>
            <th>نص المراجعة</th>
            <th>حفظ (درجة)</th>
            <th>تلاوة (درجة)</th>
            <th>تجويد (درجة)</th>
            <th>المجموع</th>
            <th>المعدل العام</th>
            <th>التقدير النهائي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:12px;font-size:13px;color:var(--muted)">ملاحظة: يمكن تعديل القيم الرقمية لاحقاً من نافذة "نتائج الطالب".</p>
    </div>`;
  return html;
}

generateReportBtn?.addEventListener('click', ()=>{
  const hid = reportHalqa.value;
  if(!hid){ alert('اختر حلقة للتقرير'); return; }
  reportPreview.innerHTML = generateReportForHalqa(hid);
  window.scrollTo(0,0);
});
saveReportPdfBtn?.addEventListener('click', async ()=>{
  if(!reportPreview.innerHTML.trim()){ alert('أنشئ التقرير أولاً'); return; }
  const { jsPDF } = window.jspdf;
  const el = reportPreview;
  const canvas = await html2canvas(el, {scale:2});
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({unit:'mm', format:'a4', orientation:'portrait'});
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth - 20;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save('report.pdf');
});

// Charts
let chartLevel = null, chartProgress = null, chartLevelDashObj = null, chartProgressDashObj = null;

function computeAvgForStudentNumeric(s){
  const rs = db.results.filter(r=>r.studentId===s.id);
  if(rs.length===0) return null;
  const last = rs[rs.length-1];
  if(last.avg !== undefined && last.avg !== null) return last.avg;
  const a = last.scoreHifz || 0;
  const b = last.scoreTalaawa || 0;
  const c = last.scoreTajweed || 0;
  if(a===0 && b===0 && c===0) return null;
  return Math.round(((a+b+c)/3) * 10) / 10;
}

function renderCharts(targetHalqa=''){
  const labels = db.halqat.map(h=>h.name);
  const avgPerHalqa = db.halqat.map(h=>{
    const students = db.students.filter(s=>s.halqaId===h.id);
    const avgs = students.map(s=>computeAvgForStudentNumeric(s)).filter(x=>x!==null);
    if(avgs.length===0) return 0;
    const sum = avgs.reduce((a,b)=>a+b,0);
    return Math.round((sum/avgs.length)*10)/10;
  });

  const palette = ['#0b84ff','#00b894','#ff9f1c','#ff6b6b','#6c5ce7','#00cec9'];

  const ctx1 = document.getElementById('chartLevel')?.getContext('2d');
  if(ctx1){
    if(chartLevel) chartLevel.destroy();
    chartLevel = new Chart(ctx1, {
      type: 'bar',
      data: { labels, datasets: [{label:'معدل الحلقة', data: avgPerHalqa, backgroundColor: palette, borderRadius:6 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}} }
    });
  }

  const ctx2 = document.getElementById('chartProgress')?.getContext('2d');
  if(ctx2){
    if(chartProgress) chartProgress.destroy();
    chartProgress = new Chart(ctx2, {
      type: 'line',
      data: { labels, datasets: [{label:'التقدم العام', data: avgPerHalqa, borderColor:palette[0], tension:0.35, fill:true, backgroundColor:'rgba(11,132,255,0.12)', pointRadius:6}] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}} }
    });
  }

  try{
    const ctxd1 = chartLevelDash?.getContext('2d');
    if(ctxd1){
      if(chartLevelDashObj) chartLevelDashObj.destroy();
      chartLevelDashObj = new Chart(ctxd1, { type:'bar', data:{labels, datasets:[{label:'معدل الحلقة', data:avgPerHalqa, backgroundColor:'#0b84ff'}]}, options:{maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}}}});
    }
    const ctxd2 = chartProgressDash?.getContext('2d');
    if(ctxd2){
      if(chartProgressDashObj) chartProgressDashObj.destroy();
      chartProgressDashObj = new Chart(ctxd2, { type:'line', data:{labels, datasets:[{label:'التقدم', data:avgPerHalqa, borderColor:'#0b6efd', tension:0.3, fill:true, backgroundColor:'rgba(11,110,253,0.08)'}]}, options:{maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}}}});
    }
  }catch(err){ console.warn(err) }
}

// Export / Import helpers
function downloadText(text, filename, type='application/json'){
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
exportAllBtn?.addEventListener('click', ()=> {
  const dataStr = JSON.stringify(db, null, 2);
  downloadText(dataStr, 'msd_al_sadeq_db.json', 'application/json');
});
exportAllBtnDash?.addEventListener('click', ()=> {
  const dataStr = JSON.stringify(db, null, 2);
  downloadText(dataStr, 'msd_al_sadeq_db.json', 'application/json');
});

importFile?.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const parsed = JSON.parse(ev.target.result);
      if(confirm('استبدال بيانات التطبيق بالبيانات المستوردة؟')){ db = parsed; saveDB(db); renderAll(); alert('تم الاستيراد'); }
    }catch(err){
      alert('فشل قراءة الملف، تأكد أنه JSON صالح');
    }
  };
  reader.readAsText(f);
});
importFileDash?.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const parsed = JSON.parse(ev.target.result);
      if(confirm('استبدال بيانات التطبيق بالبيانات المستوردة؟')){ db = parsed; saveDB(db); renderAll(); alert('تم الاستيراد'); }
    }catch(err){
      alert('فشل قراءة الملف، تأكد أنه JSON صالح');
    }
  };
  reader.readAsText(f);
});

// CSV export
document.getElementById('exportHalqatCsv')?.addEventListener('click', ()=>{
  const csv = Papa.unparse(db.halqat);
  downloadText(csv, 'halqat.csv', 'text/csv');
});
document.getElementById('exportStudentsCsv')?.addEventListener('click', ()=>{
  const rows = db.students.map(s=>({ id:s.id, name:s.name, age:s.age, phone:s.phone, halqa: db.halqat.find(h=>h.id===s.halqaId)?.name || '' }));
  const csv = Papa.unparse(rows);
  downloadText(csv, 'students.csv', 'text/csv');
});

// Dashboard stats
function dashboardStatsAndRender(){
  const totalStudents = db.students.length;
  const totalHalqat = db.halqat.length;
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const studentsWithResultThisMonth = new Set();
  db.results.forEach(r=>{
    const d = new Date(r.date);
    if(d.getMonth()===curMonth && d.getFullYear()===curYear){
      studentsWithResultThisMonth.add(r.studentId);
    }
  });
  const progressPercent = totalStudents === 0 ? 0 : Math.round((studentsWithResultThisMonth.size / totalStudents) * 100);

  if(statStudents) statStudents.textContent = totalStudents;
  if(statHalqat) statHalqat.textContent = totalHalqat;
  if(statProgress) statProgress.textContent = `${progressPercent} / 100`;
}

// Main render
function renderAll(){
  renderHalqat();
  renderStudents();
  renderCharts();
  dashboardStatsAndRender();
}
renderAll();

// small behaviors & events
chartsHalqa?.addEventListener('change', ()=> renderCharts(chartsHalqa.value));
refreshChartsBtn?.addEventListener('click', ()=> renderCharts(chartsHalqa.value));
reportHalqa?.addEventListener('change', ()=> { if(reportHalqa.value) reportPreview.innerHTML = generateReportForHalqa(reportHalqa.value); });
filterHalqa?.addEventListener('change', ()=> renderStudents());

// escape helper
function escapeHtmlInline(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// calc preview
document.getElementById('calcPreview')?.addEventListener('click', ()=>{
  const a = Number(document.getElementById('scoreHifz').value || 0);
  const b = Number(document.getElementById('scoreTalaawa').value || 0);
  const c = Number(document.getElementById('scoreTajweed').value || 0);
  if(a===0 && b===0 && c===0) return alert('أدخل درجة على الأقل لحقل واحد ليتم الحساب');
  const total = a + b + c;
  const avg = +(total/3).toFixed(1);
  const grade = computeGrade(avg);
  alert(`المجموع: ${total}\nالمعدل: ${avg}\nالتقدير: ${grade}`);
});

// ensure charts render after load
setTimeout(()=> renderCharts(), 300);
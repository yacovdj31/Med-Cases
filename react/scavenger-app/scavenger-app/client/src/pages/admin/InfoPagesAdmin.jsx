import { useEffect, useState } from 'react';
import { api } from '../../api';


export default function InfoPagesAdmin(){
const [boxes, setBoxes] = useState([]);
const [items, setItems] = useState([]);
const [form, setForm] = useState({ boxId:'', country:'US', title:'', content:'', links:[] });


useEffect(()=>{ (async ()=>{
const b = await api.get('/boxes'); setBoxes(b.data);
const l = await api.get('/info/list'); setItems(l.data);
})(); },[]);


const save = async ()=>{
const res = await api.post('/info', { ...form, links: form.links.filter(Boolean) });
setItems([res.data, ...items]);
alert('Saved');
};


return (
<div className="grid gap-4">
<h1 className="text-xl font-bold">Info pages (by box + country)</h1>
<div className="bg-white p-4 rounded-lg shadow grid md:grid-cols-2 gap-3">
<select className="input" value={form.boxId} onChange={e=>setForm(f=>({...f,boxId:e.target.value}))}>
<option value="">Choose box</option>
{boxes.map(b=> <option key={b._id} value={b._id}>{b.key} — {b.title}</option>)}
</select>
<select className="input" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
<option>US</option><option>CA</option><option>IL</option>
</select>
<input className="input" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
<textarea className="input h-40" placeholder="Content" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} />
<button className="btn-primary" onClick={save}>Save</button>
</div>


<div className="grid gap-2">
{items.map(it=> (
<div key={it._id} className="p-3 bg-white rounded border">
<div className="text-sm text-gray-500">{new Date(it.updatedAt).toLocaleString()}</div>
<div className="font-semibold">{it.title} — {it.country}</div>
<div className="text-sm">box: {it.boxId}</div>
</div>
))}
</div>
</div>
);
}
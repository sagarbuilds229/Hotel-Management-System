import { useEffect, useState } from "react";
import { storage } from "../../utils/storage";
import Card from "../../components/common/Card";

export default function Reviews() {
  const [list, setList] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [filter, setFilter] = useState("All");

  useEffect(()=> setList(storage.getReviews()),[]);

  const avg = list.length ? (list.reduce((s,r)=>s+r.rating,0)/list.length).toFixed(1) : "-";
  const dist = [5,4,3,2,1].map(st=> ({ stars: st, count: list.filter(r=>r.rating===st).length }));

  const handleReply = (id) => {
    const text = replyMap[id]?.trim();
    if (!text) { alert("Enter reply"); return; }
    const updated = list.map(r=> r.id===id ? {...r, reply: text} : r);
    storage.saveReviews(updated);
    setList(updated);
  };

  const filtered = filter==="All" ? list : list.filter(r=> String(r.rating)===String(filter).charAt(0));

  return (
    <div className="page">
      <div className="page-head">
        <h2>Rating & Reviews</h2>
        <p className="muted">Function 5: View guest feedback post check-out, reply, monitor satisfaction. Mock reviews stored locally.</p>
      </div>

      <div className="grid-2">
        <Card title="Overall Rating">
          <div className="rating-hero">
            <span className="rating-big">{avg} <small>/5</small></span>
            <span className="muted">{list.length} reviews</span>
          </div>
          <div style={{marginTop:12}}>
            {dist.map(d=>(
              <div key={d.stars} className="rating-bar">
                <span>{d.stars}★</span>
                <div className="bar"><div className="bar-fill" style={{width: list.length? `${(d.count/list.length)*100}%` : "0%"}} /></div>
                <span>{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Filter">
          <div className="toolbar">
            <select value={filter} onChange={e=>setFilter(e.target.value)}>
              <option>All</option><option>5 Stars</option><option>4 Stars</option><option>3 Stars</option><option>2 Stars</option><option>1 Star</option>
            </select>
            <span className="muted small">Showing {filtered.length} of {list.length}</span>
          </div>
          <p className="muted small">In real system, guests submit via User/Customer portal. Receptionist only views & responds here.</p>
        </Card>
      </div>

      <div className="reviews-grid">
        {filtered.map(r=>(
          <Card key={r.id} title={`${r.guestName} — Room ${r.roomNumber}`} subtitle={`${r.date} • ${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}`}>
            <p>"{r.comment}"</p>
            {r.reply ? (
              <div className="reply-box">
                <strong>Receptionist Reply:</strong> {r.reply}
              </div>
            ) : (
              <div className="reply-form">
                <input placeholder="Write a reply..." value={replyMap[r.id]||""} onChange={e=>setReplyMap({...replyMap, [r.id]:e.target.value})} />
                <button className="btn btn-sm btn-primary" onClick={()=>handleReply(r.id)}>Reply</button>
              </div>
            )}
          </Card>
        ))}
        {filtered.length===0 && <p className="muted">No reviews in this filter.</p>}
      </div>
    </div>
  );
}


export default function AedsNotificationCenter(){
  const notifications=[
    {title:"Voucher Approved",time:"2 min ago"},
    {title:"Room 203 Checked In",time:"8 min ago"},
    {title:"Purchase Awaiting Approval",time:"15 min ago"},
  ];
  return (
    <section style={{padding:24,border:'1px solid #ddd',borderRadius:16}}>
      <h2>Notification Center</h2>
      {notifications.map((n,i)=>(
        <div key={i} style={{padding:'10px 0',borderBottom:'1px solid #eee'}}>
          <strong>{n.title}</strong><br/>
          <small>{n.time}</small>
        </div>
      ))}
    </section>
  );
}

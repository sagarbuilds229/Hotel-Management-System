export default function Badge({ status }) {
  const cls = `badge badge-${String(status).toLowerCase().replace(/\s/g,"-")}`;
  return <span className={cls}>{status}</span>;
}

export default function handler(req, res) {
  console.log("hello")
  console.log(process.env.SUPABASE_SERVICE_ROLE_KEY)

  res.status(200).json({ ok: true })
}
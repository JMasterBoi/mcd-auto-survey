import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = "mongodb+srv://Juanito:3gaDE9iMO3BIeGVh@cluster0.2duv9fo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const codesDb = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}).db("Mc_Donalds_Survey").collection("codes");

export default async function handler(req, res) {
  const {code} = req.query
  if (!code) return res.status(400).json({ error: "Missing Code" });

  codesDb.findOne({_id: code}).then((response) => {
    if (response) {
      res.status(200).json({valCode: response.valCode});
    } else {
      res.status(404).json({valCode: "N/A"})
    }
  }).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err });
  });
}
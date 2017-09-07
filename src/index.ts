import * as express from 'express';
import * as request from 'request-promise-native';
import * as xml2js from 'xml2js';
import * as moment from 'moment';

const app = express();
const port = process.env.PORT || 3000;

function parseXml(xml: string): Promise<any> {
  return new Promise((resolve, reject) => xml2js.parseString(xml, (err, result) => {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  }));
}

async function fetchRates(symbol: string) {
  const ratesEcbXml = await request.get('http://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/' + symbol + '.xml');
  
  const parsed = await parseXml(ratesEcbXml);
  const mapped = parsed.CompactData.DataSet[0].Series[0].Obs.reduce((acc, cur) => {
    acc[cur.$.TIME_PERIOD] = cur.$.OBS_VALUE;
    return acc;
  }, {});
  return mapped;
}

app.use('/rates/:symbol', (req, res) => {
  fetchRates(req.params.symbol).then(rates => res.json(rates), err => res.status(500).json(err));
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});
import React, { useState, useEffect } from 'react';
import SerialLineChart from '../Chart/SerialLineChart';
import { prometheusRangeQuery, IPromParams } from '@/services/prometheus-query';
import { IPromQuery } from '@/services/prometheus-config';

// const dumbData = [
//   [1540982900657, 23.45678],
//   [1540982930657, 12.345678],
//   [1540982960657, 21.123457],
//   [1540982990657, 33.555555],
//   [1540983020657, 1.6789769],
//   [1540983050657, 0],
//   [1540983080657, 12.3432543],
//   [1540983110657, 46.4356546],
//   [1540983140657, 11.546345657],
//   [1540983170657, 22.111111],
//   [1540983200657, 11.11111],
// ];
// const dumbLables = ['timestamp', 'qps'];

interface PrometheusChartProps {
  title?: string;

  promQueries: IPromQuery[];
  promParams: IPromParams;
}

function PrometheusChart({ title, promQueries, promParams }: PrometheusChartProps) {
  const [loading, setLoading] = useState(false);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [oriChartData, setOriChartData] = useState<number[][]>([]);

  useEffect(() => {
    function query() {
      setLoading(true);
      Promise.all(
        promQueries.map(metric =>
          prometheusRangeQuery(metric.promQL, metric.labelTemplate, promParams),
        ),
      ).then(results => {
        let labels: string[] = [];
        let data: number[][] = [];
        results
          .filter(result => result.metricValues.length > 0)
          .forEach((result, idx) => {
            if (idx === 0) {
              labels = result.metricLabels;
              data = result.metricValues;
            } else {
              labels = labels.concat(result.metricLabels.slice(1));
              const emtpyPlacehoder: number[] = Array(result.metricLabels.length).fill(0);
              data = data.map((item, index) =>
                // the result.metricValues may have different length
                // so result.metricValues[index] may undefined
                item.concat((result.metricValues[index] || emtpyPlacehoder).slice(1)),
              );
            }
          });
        setChartLabels(labels);
        setOriChartData(data);
        setLoading(false);
      });
    }

    query();
  }, [promQueries, promParams]);

  return (
    <div>
      {title && <h4 style={{ textAlign: 'center', marginTop: 10 }}>{title}</h4>}
      {loading && <p style={{ textAlign: 'center' }}>loading...</p>}
      {!loading && oriChartData.length === 0 && <p style={{ textAlign: 'center' }}>No Data</p>}
      {!loading && oriChartData.length > 0 && (
        <div style={{ height: 200 }}>
          <SerialLineChart
            data={oriChartData}
            labels={chartLabels}
            valConverter={promQueries[0].valConverter}
          />
        </div>
      )}
    </div>
  );
}

export default PrometheusChart;

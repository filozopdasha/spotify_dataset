import React, { useRef, useEffect } from "react";
import { Pivot } from "react-flexmonster";
import "flexmonster/flexmonster.css";
import "./App.css";

import Highcharts from "highcharts";
import "flexmonster/lib/flexmonster.highcharts.js";

function App() {
    const pivotRef = useRef(null);

    const report = {
        dataSource: {
            filename: "/spotify-top-200-dataset.csv",
            mapping: {
                "artist_name": { type: "string" },
                "track_name": { type: "string" },
                "streams": { type: "number" }
            }
        },
        slice: {
            rows: [
                { uniqueName: "artist_name" },
                { uniqueName: "track_name" }
            ],
            measures: [
                {
                    uniqueName: "streams",
                    aggregation: "sum",
                }
            ],
            sorting: {
                column: {
                    type: "desc",
                    tuple: [],
                    measure: "streams"
                }
            }
        },


    };

    useEffect(() => {
        const handleReportComplete = () => {
            const pivot = pivotRef.current?.flexmonster;
            if (pivot) {
                pivot.highcharts.getData(
                    { type: "column" },
                    (data) => {
                        Highcharts.chart("highcharts-container", data);
                    },
                );
            }
        };

        const pivot = pivotRef.current?.flexmonster;
        if (pivot) {
            pivot.on("reportcomplete", handleReportComplete);
        }

    }, []);

    return (
        <div id="container-location ">
            <h1>Spotify Top 200 Insights</h1>

            <Pivot
                ref={pivotRef}
                toolbar={true}
                report={report}
                licenseFilePath="https://cdn.flexmonster.com/jsfiddle.charts.key"
            />

            <div
                id="highcharts-container"
                style={{ height: "500px", marginTop: "50px" }}
            ></div>
        </div>
    );
}

export default App;
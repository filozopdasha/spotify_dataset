import React, { useRef, useState, useEffect } from "react";
import { Pivot } from "react-flexmonster";
import "flexmonster/flexmonster.css";
import "../flexmonster.css"
import "./App.css";

import Highcharts from "highcharts";
import "flexmonster/lib/flexmonster.highcharts.js";

function App() {
    const pivotRef = useRef(null);
    const [showOriginalPivot, setShowOriginalPivot] = useState(true);
    const [artistGenresMap, setArtistGenresMap] = useState({});

    useEffect(() => {
        fetch("/spotify-top-200-dataset.csv")
            .then((res) => res.text())
            .then((csvText) => {
                const lines = csvText.trim().split("\n");
                const map = {};
                const header = lines[0].split(";");
                const artistIdx = header.indexOf("artist_name");
                const genresIdx = header.indexOf("artist_genres");

                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(";");
                    const artist = row[artistIdx];
                    const genres = row[genresIdx];
                    if (artist && genres && !map[artist]) {
                        map[artist] = genres.split(",")[0].trim();
                    }
                }
                setArtistGenresMap(map);
            })
            .catch((err) => {
                console.error("Failed to load CSV for genres map", err);
            });
    }, []);

    const report = {
        dataSource: {
            filename: "/spotify-top-200-dataset.csv",
            mapping: {
                artist_name: { type: "string" },
                track_name: { type: "string" },
                streams: { type: "number" },
            },
        },
        slice: {
            rows: [
                { uniqueName: "artist_name" },
                { uniqueName: "track_name" }
            ],
            measures: [
                {
                    uniqueName: "streams",
                    aggregation: "sum"
                }
                ],
            sorting: {
                column: {
                    type: "desc",
                    tuple: [],
                    measure: "streams",
                },
            },
        },
    };

    const genresReport = {
        dataSource: {
            filename: "/spotify-top-200-dataset.csv",
            mapping: {
                artist_name: { type: "string" },
                streams: { type: "number" },
                album_name: { type: "string" },
                release_date: { type: "date" }
            },
        },
        slice: {
            rows: [
                { uniqueName: "release_date.Year" },
                { uniqueName: "album_name" }
            ],
            columns: [
                {
                    uniqueName: "artist_name",
                    filter: {
                        measure: "streams",
                        type: "top",
                        quantity: 20
                    },
                    sort: "desc"
                }
            ],
            measures: [
                { uniqueName: "streams", aggregation: "sum" }
            ],
            sorting: {
                column: {
                    type: "desc",
                    tuple: [],
                    measure: "streams"
                }
            }
        }
    };


    useEffect(() => {
        if (showOriginalPivot && pivotRef.current?.flexmonster) {
            const pivot = pivotRef.current.flexmonster;

            const handleReportComplete = () => {
                pivot.highcharts.getData({ type: "column" }, (data) => {
                    Highcharts.chart("highcharts-container", {
                        ...data,
                        chart: {
                            ...data.chart,
                            backgroundColor: "transparent",
                            style: {
                                fontFamily:
                                    "'Poppins', 'Circular Spotify Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                            },
                        },
                        title: {
                            text: "Spotify Top 200 Streams",
                            style: {
                                color: "#1DB954",
                                fontWeight: "900",
                                fontSize: "26px",
                                textShadow: "0 0 8px #1DB954",
                            },
                        },
                        xAxis: {
                            ...data.xAxis,
                            labels: {
                                style: { color: "#E3E3E3", fontSize: "13px" },
                            },
                            lineColor: "#1DB954",
                            tickColor: "#1DB954",
                        },
                        yAxis: {
                            ...data.yAxis,
                            labels: {
                                style: { color: "#E3E3E3", fontSize: "13px" },
                            },
                            gridLineColor: "rgba(29, 185, 84, 0.3)",
                            title: {
                                text: "Streams",
                                style: { color: "#1DB954", fontWeight: "700" },
                            },
                        },
                        legend: {
                            enabled: false,
                        },
                        plotOptions: {
                            column: {
                                color: "#1DB954",
                                borderRadius: 6,
                                shadow: {
                                    color: "rgba(29, 185, 84, 0.8)",
                                    offsetX: 0,
                                    offsetY: 0,
                                    opacity: 0.9,
                                    width: 12,
                                },
                            },
                        },
                        tooltip: {
                            backgroundColor: "#1DB954",
                            style: { color: "#121212", fontWeight: "700" },
                            borderRadius: 8,
                            borderWidth: 0,
                            shadow: true,
                            animation: true,
                        },
                        series: data.series,
                    });
                });
            };
            pivot.on("reportcomplete", handleReportComplete);
        }
    }, [showOriginalPivot]);

    useEffect(() => {
        if (!showOriginalPivot && pivotRef.current?.flexmonster) {
            const pivot = pivotRef.current.flexmonster;

            pivot.off("cellprepare");

            pivot.on("cellprepare", function (cell) {
                if (
                    cell.type === "rowHeader" &&
                    cell.hierarchy &&
                    cell.hierarchy.length === 1
                ) {
                    const artistName = cell.label;
                    const genre = artistGenresMap[artistName] || "";

                    if (cell.element && !cell.element.querySelector(".genre-label")) {
                        const genreSpan = document.createElement("span");
                        genreSpan.textContent = genre ? ` | ${genre} |` : "";
                        genreSpan.className = "genre-label";
                        genreSpan.style.color = "#1DB954";
                        genreSpan.style.fontWeight = "700";
                        genreSpan.style.marginLeft = "6px";
                        cell.element.appendChild(genreSpan);
                    }
                }
            });

            pivot.refresh();
        }
    }, [showOriginalPivot, artistGenresMap]);

    function customizeToolbar(toolbar) {
        const tabs = toolbar.getTabs();
        toolbar.getTabs = function () {
            tabs.unshift({
                id: "fm-tab-newtab",
                title: showOriginalPivot ? "Albums" : "Tracks",
                handler: newTabHandler,
                icon: this.icons.options,
            });
            return tabs;
        };
    }

    function newTabHandler() {
        setShowOriginalPivot((prev) => !prev);
    }

    return (
        <div id="app-container">
            <header>
                <h1>Spotify Insights</h1>
            </header>
            <main>
                {showOriginalPivot ? (
                    <Pivot
                        key="original"
                        ref={pivotRef}
                        toolbar={true}
                        beforetoolbarcreated={customizeToolbar}
                        report={report}
                        licenseFilePath="https://cdn.flexmonster.com/jsfiddle.charts.key"
                        width="100%"
                        height="400px"
                    />
                ) : (
                    <Pivot
                        key="genres"
                        ref={pivotRef}
                        toolbar={true}
                        beforetoolbarcreated={customizeToolbar}
                        report={genresReport}
                        licenseFilePath="https://cdn.flexmonster.com/jsfiddle.charts.key"
                        width="100%"
                        height="400px"
                    />
                )}
                <div id="highcharts-container"></div>
            </main>
        </div>
    );
}

export default App;
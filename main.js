let yourStats
let globalStats

function processYourStats() {
    const inputString = document.querySelector("#input-textarea").value
    const lines = inputString.split("\n").map(line => line.trim().split(/\s+/)).filter(line => /^\d+$/.test(line[0]))
    const yourStats = lines.map(line => {
        return {
            day: parseInt(line[0]),
            stats: [
                { time: line[1], rank: parseInt(line[2]), score: parseInt(line[3]) },
                { time: line[4], rank: parseInt(line[5]), score: parseInt(line[6]) }
            ]
        }
    })

    return yourStats.sort((a, b) => a.day > b.day)
}

function processGlobalStats(year) {
    // TODO: replace with a caching system
    return fetch(`https://marcors.ferned.net/https://adventofcode.com/${year}/stats`)
        .then(resp => resp.text())
        .then(text => new DOMParser().parseFromString(text, "text/html"))
        .then(html => html.querySelector("pre.stats"))
        .then(statsElement => {
            // console.log(statsElement)
            const statsLines = statsElement.textContent.trim().split("\n").map(line => line.trim().split(/\s+/)).filter(line => /^\d+$/.test(line[0]))

            return statsLines.map(line => [parseInt(line[0]), parseInt(line[1]), parseInt(line[2])])
        })
        .then(result => result.sort((a, b) => a[0] - b[0]))
        .catch()
}

function discretizeRawPercent(rawPercent) {
    const buckets = [0.001, 0.005, 0.01, 0.025, 0.05, 0.10, 0.25, 0.33, 0.50, 0.75, 1.0]
    return buckets.filter(bucketEnd => bucketEnd >= rawPercent)[0] * 100
}

function plotPerformance(comparedStats, rankOnly = false) {
    document.querySelector("#results-chart").innerHTML = "";
    document.querySelector("#results-chart").appendChild(document.createElement("canvas"))

    const ctx = document.querySelector("#results-chart>canvas").getContext("2d")

    new Chart(ctx, {
        type: "line",

        data: {
            labels: comparedStats.map(entry => `${(entry[0])}`),
            datasets: [
                {
                    label: "Part 1",
                    backgroundColor: "#1a85ff",
                    borderColor: "#1a85ff",
                    pointBackgroundColor: "#1a85ff",
                    pointBorderColor: "#1a85ff",
                    fill: false,
                    data: comparedStats.map(entry => rankOnly ? entry[1] : entry[2])
                },
                {
                    label: "Part 2",
                    backgroundColor: "#d41159",
                    borderColor: "#d41159",
                    pointBackgroundColor: "#d41159",
                    pointBorderColor: "#d41159backgroundColor",
                    fill: false,
                    data: comparedStats.map(entry => rankOnly ? entry[2] : entry[4])
                },
            ]
        },

        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function (value, index, values) {
                            return rankOnly ? value : `${~~(value * 100)}%`
                        }
                    }
                }]
            }
        }
    })
}

function generateStats(totalUsers = false, rankOnly = false) {
    console.log(`totalUsers: ${totalUsers}. rankOnly: ${rankOnly}`)
    document.querySelector("#results-body").innerHTML = "";

    const yourStatsCompared = yourStats.map((val) => {
        const partOneTotal = !totalUsers ? globalStats[val.day - 1][1] + globalStats[val.day - 1][2] : globalStats[0][1] + globalStats[0][2]
        const partTwoTotal = !totalUsers ? globalStats[val.day - 1][1] : globalStats[0][1] + globalStats[0][2]

        if (rankOnly)
            return [val.day, val.stats[0].rank, val.stats[1].rank]
        else
            return [
                val.day,
                val.stats[0].rank,
                val.stats[0].rank / partOneTotal,
                val.stats[1].rank,
                val.stats[1].rank / partTwoTotal
            ]
    }).sort((a, b) => a[0] - b[0])

    yourStatsCompared.map(row => {
        const rowEl = document.createElement("tr")
        row.forEach((item, i) => {
            let element = document.createElement("td")
            element.innerHTML = i % 2 == 0 && i > 0 && !Number.isNaN(item) && !rankOnly ? `Top ${discretizeRawPercent(item)}%` : !Number.isNaN(item) ? `${item}` : "&mdash;"
            rowEl.appendChild(element)
        })

        document.querySelector("#results-body").appendChild(rowEl)
    })

    if (rankOnly)
        [...document.querySelectorAll("#results-table th")].map(el => { if (el.textContent.includes("%")) el.style.display = "none" })
    else
        [...document.querySelectorAll("#results-table th")].map(el => { el.style.display = "table-cell" });

    const buttons = [...document.querySelectorAll(".buttons-container>button")]

    buttons.map(button => button.className = "button is-small");
    if (rankOnly) {
        buttons[2].classList.add("is-success")
        buttons[2].classList.add("is-selected")
    } else if (totalUsers) {
        buttons[1].classList.add("is-success")
        buttons[1].classList.add("is-selected")
    } else {
        buttons[0].classList.add("is-success")
        buttons[0].classList.add("is-selected")
    }

    plotPerformance(yourStatsCompared, rankOnly = rankOnly)
}

async function handleInput() {
    const year = document.querySelector("#year-selector").value

    yourStats = processYourStats()
    if (yourStats.length == 0) {
        alert("You need to put something in here...")
        return -1
    }
    globalStats = await processGlobalStats(year)

    generateStats()

    document.querySelector("#results-container").style.display = "block"
    document.querySelector("#form-container").style.display = "none"
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("#compute-button").addEventListener("click", handleInput)

    document.querySelector("#per-day-selector").addEventListener("click", generateStats.bind(null, false, false))
    document.querySelector("#total-users-selector").addEventListener("click", generateStats.bind(null, true, false))
    document.querySelector("#rank-only-selector").addEventListener("click", generateStats.bind(null, false, true))
}, false);

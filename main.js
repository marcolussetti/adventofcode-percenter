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
    return fetch(`https://cors-anywhere.herokuapp.com/https://adventofcode.com/${year}/stats`)
        .then(resp => resp.text())
        .then(text => new DOMParser().parseFromString(text, "text/html"))
        .then(html => html.querySelector("pre.stats"))
        .then(statsElement => {
            // console.log(statsElement)
            const statsLines = statsElement.textContent.trim().split('\n').map(line => line.trim().split(/\s+/)).filter(line => /^\d+$/.test(line[0]))

            return statsLines.map(line => [parseInt(line[0]), parseInt(line[1]), parseInt(line[2])])
        })
        .then(result => result.sort((a, b) => a[0] - b[0]))
        .catch(err => { })
}

function discretizeRawPercent(rawPercent) {
    const buckets = [0.001, 0.005, 0.01, 0.025, 0.05, 0.10, 0.25, 0.33, 0.50, 0.75, 1.0]
    return buckets.filter(bucketEnd => bucketEnd >= rawPercent)[0] * 100
}

function plotPerformance(comparedStats) {
    const ctx = document.querySelector("#results-chart").getContext("2d")

    let chart = new Chart(ctx, {
        type: 'line',

        data: {
            labels: comparedStats.map(entry => `${(entry[0])}`),
            datasets: [
                {
                    label: "Part 1",
                    backgroundColor: '#1a85ff',
                    borderColor: '#1a85ff',
                    pointBackgroundColor: '#1a85ff',
                    pointBorderColor: '#1a85ff',
                    fill: false,
                    data: comparedStats.map(entry => entry[2])
                },
                {
                    label: "Part 2",
                    backgroundColor: '#d41159',
                    borderColor: '#d41159',
                    pointBackgroundColor: '#d41159',
                    pointBorderColor: '#d41159',
                    fill: false,
                    data: comparedStats.map(entry => entry[4])
                },
            ]
        },

        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function (value, index, values) {
                            return `${value * 100}%`
                        }
                    }
                }]
            }
        }
    })
}

async function handleInput() {
    document.querySelector("#results-body").innerHTML = "";

    const year = document.querySelector("#year-selector").value

    const yourStats = processYourStats()
    if (yourStats.length == 0) {
        alert("You need to put something in here...")
        return -1
    }
    const globalStats = await processGlobalStats(year)

    const yourStatsCompared = yourStats.map((val) => {
        return [
            val.day,
            val.stats[0].rank,
            val.stats[0].rank / (globalStats[val.day - 1][1] + globalStats[val.day - 1][2]),
            val.stats[1].rank,
            val.stats[1].rank / globalStats[val.day - 1][1]
        ]
    }).sort((a, b) => a[0] - b[0])

    const yourStatsElements = yourStatsCompared.map(row => {
        const rowEl = document.createElement("tr")
        row.forEach((item, i) => {
            let element = document.createElement("td")
            element.innerHTML = i % 2 == 0 && i > 0 && !Number.isNaN(item) ? `Top ${discretizeRawPercent(item)}%` : !Number.isNaN(item) ? `${item}` : "&mdash;"
            rowEl.appendChild(element)
        })

        document.querySelector("#results-body").appendChild(rowEl)
    })

    document.querySelector("#results-container").style.display = "block"
    document.querySelector("#form-container").style.display = "none"
    plotPerformance(yourStatsCompared)
}

document.querySelector("#compute-button").addEventListener("click", handleInput)

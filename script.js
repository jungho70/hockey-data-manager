const navButtons =
  document.querySelectorAll(".nav-btn");

const pages =
  document.querySelectorAll(".page");


let agingChart = null;

let quizChart = null;

let currentPlayerChart = null;

let quizRevealed = false;

let quizChoice = null;

let missionIndex = 0;



function showPage(id) {

  navButtons.forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.page === id
    );

  });


  pages.forEach(page => {

    page.classList.toggle(
      "active",
      page.id === id
    );

  });


  if (id === "aging") {

    drawAgingChart();

  }


  if (id === "quiz") {

    setupQuiz();

  }


  if (id === "coach") {

    setupMission();

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}



navButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => showPage(button.dataset.page)
  );

});



document
  .querySelector(".go-aging")
  .addEventListener(
    "click",
    () => showPage("aging")
  );



/* 5차 다항회귀식 */

function agingFunction(x) {

  return (
    2.35e-5 * x ** 5

    - 0.003181 * x ** 4

    + 0.171 * x ** 3

    - 4.563 * x ** 2

    + 60.44 * x

    - 317.2
  );

}



function commonChartOptions(
  xTitle,
  yTitle
) {

  return {

    responsive: true,

    maintainAspectRatio: false,

    scales: {

      x: {

        type: "linear",

        title: {
          display: true,
          text: xTitle,
          color: "#9fb0c4"
        },

        ticks: {
          color: "#9fb0c4"
        },

        grid: {
          color: "rgba(159,176,196,.08)"
        }

      },


      y: {

        title: {
          display: true,
          text: yTitle,
          color: "#9fb0c4"
        },

        ticks: {
          color: "#9fb0c4"
        },

        grid: {
          color: "rgba(159,176,196,.08)"
        }

      }

    },


    plugins: {

      legend: {

        labels: {
          color: "#f4f7fb"
        }

      }

    }

  };

}



/* =========================
   에이징 커브
========================= */

function drawAgingChart() {

  const averagePoints =
    Object.entries(HISTORICAL_AVERAGE)

      .map(([age, value]) => ({
        x: Number(age),
        y: Number(value)
      }));



  const curvePoints = [];


  for (
    let x = 18;
    x <= 39;
    x += 0.1
  ) {

    curvePoints.push({

      x: Number(x.toFixed(1)),

      y: agingFunction(x)

    });

  }



  if (agingChart) {

    agingChart.destroy();

  }



  agingChart =
    new Chart(

      document.getElementById(
        "agingChart"
      ),

      {

        type: "line",


        data: {

          datasets: [


            {

              label:
                "은퇴 선수 8명 실제 평균",

              data:
                averagePoints,

              borderColor:
                "#ffffff",

              backgroundColor:
                "#ffffff",

              pointRadius: 4,

              tension: 0.1

            },


            {

              label:
                "5차 다항회귀 에이징 커브",

              data:
                curvePoints,

              borderColor:
                "#63adff",

              pointRadius: 0,

              borderWidth: 3,

              tension: 0.18

            }

          ]

        },


        options: {

          ...commonChartOptions(
            "나이 (Age)",
            "득점률 (Goals per Game)"
          ),

          parsing: false

        }

      }

    );

}



/* =========================
   예측 퀴즈
========================= */

const historicalSelect =
  document.getElementById(
    "historicalSelect"
  );



function setupQuiz() {

  if (
    historicalSelect.options.length === 0
  ) {

    Object
      .keys(HISTORICAL_PLAYERS)
      .forEach(name => {

        const option =
          document.createElement(
            "option"
          );


        option.value = name;

        option.textContent = name;


        historicalSelect
          .appendChild(option);

      });



    historicalSelect
      .addEventListener(
        "change",
        () => {

          quizRevealed = false;

          quizChoice = null;


          document
            .getElementById(
              "quizResult"
            )
            .classList
            .add("hidden");


          drawQuiz();

        }
      );

  }


  drawQuiz();

}



function getSortedEntries(object) {

  return Object
    .entries(object)

    .map(
      ([age, value]) => [

        Number(age),

        Number(value)

      ]
    )

    .sort(
      (a, b) =>
        a[0] - b[0]
    );

}



function drawQuiz() {

  const name =
    historicalSelect.value
    ||
    Object.keys(
      HISTORICAL_PLAYERS
    )[0];


  const entries =
    getSortedEntries(
      HISTORICAL_PLAYERS[name]
    );


  const cutIndex =
    Math.max(
      4,
      Math.floor(
        entries.length * 0.55
      )
    );


  const cutAge =
    entries[cutIndex][0];


  document
    .getElementById(
      "quizQuestion"
    )
    .textContent =

    `${cutAge}세 이후 이 선수의 득점률은 전체적으로 어떻게 변했을까요?`;



  const shown =
    quizRevealed

    ? entries

    : entries.slice(
        0,
        cutIndex + 1
      );



  if (quizChart) {

    quizChart.destroy();

  }



  quizChart =
    new Chart(

      document.getElementById(
        "quizChart"
      ),

      {

        type: "line",


        data: {

          datasets: [

            {

              label: name,

              data:
                shown.map(
                  ([x, y]) => ({
                    x,
                    y
                  })
                ),

              borderColor:
                "#63adff",

              backgroundColor:
                "#9bd1ff",

              pointRadius: 4,

              tension: 0.12

            }

          ]

        },


        options: {

          ...commonChartOptions(
            "나이",
            "득점률"
          ),

          parsing: false

        }

      }

    );

}



document
  .querySelectorAll(
    ".choice"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        quizChoice =
          button.dataset.answer;


        const labels = {

          up: "상승",

          flat: "비슷",

          down: "하락"

        };


        const result =
          document.getElementById(
            "quizResult"
          );


        result.innerHTML =

          `내 예측: <b>${labels[quizChoice]}</b><br>
          실제 기록을 확인해보세요.`;


        result
          .classList
          .remove("hidden");

      }
    );

  });



document
  .getElementById(
    "revealBtn"
  )
  .addEventListener(
    "click",
    () => {

      quizRevealed = true;


      drawQuiz();



      const name =
        historicalSelect.value;


      const entries =
        getSortedEntries(
          HISTORICAL_PLAYERS[name]
        );


      const cutIndex =
        Math.max(
          4,
          Math.floor(
            entries.length * 0.55
          )
        );


      const before =
        entries[cutIndex][1];


      const afterEntries =
        entries.slice(
          cutIndex + 1
        );


      const afterAverage =

        afterEntries.reduce(
          (sum, item) =>
            sum + item[1],
          0
        )

        /

        afterEntries.length;



      let actual =
        "비슷";


      if (
        afterAverage >
        before * 1.07
      ) {

        actual =
          "상승";

      }


      if (
        afterAverage <
        before * 0.93
      ) {

        actual =
          "하락";

      }



      const result =
        document.getElementById(
          "quizResult"
        );


      result.innerHTML =

        `실제 이후 평균 흐름은
        <b>${actual}</b>에 더 가까웠습니다.<br>
        전체 그래프와 자신의 예측을 비교해보세요.`;


      result
        .classList
        .remove("hidden");

    }
  );



/* =========================
   감독 모드
========================= */

const missions = [


  {

    title:
      "장기 리빌딩",

    description:
      "향후 5년 이상 팀의 핵심이 될 공격수를 영입하세요. 현재 득점률뿐 아니라 나이와 성장 가능성도 중요합니다.",

    candidates: [
      "Macklin Celebrini",
      "Connor Bedard",
      "Leo Carlsson",
      "Wyatt Johnston"
    ],

    weights: {
      current: 0.35,
      trend: 0.35,
      youth: 0.30
    }

  },


  {

    title:
      "지금 우승해야 한다",

    description:
      "이번 시즌 우승이 목표입니다. 미래 성장성보다 현재 득점력을 우선해 선수를 선택하세요.",

    candidates: [
      "Connor McDavid",
      "Nathan MacKinnon",
      "Leon Draisaitl",
      "Auston Matthews"
    ],

    weights: {
      current: 0.80,
      trend: 0.15,
      youth: 0.05
    }

  },


  {

    title:
      "균형 잡힌 3년 계약",

    description:
      "현재 득점력과 앞으로의 위험을 함께 고려해 3년 동안 안정적으로 기여할 선수를 선택하세요.",

    candidates: [
      "Jack Hughes",
      "Auston Matthews",
      "Connor McDavid",
      "Nikita Kucherov"
    ],

    weights: {
      current: 0.55,
      trend: 0.25,
      youth: 0.20
    }

  }

];



function getPlayerStats(name) {

  const entries =
    getSortedEntries(
      CURRENT_PLAYERS[name]
    );


  const latest =
    entries[
      entries.length - 1
    ];


  const age =
    latest[0];


  const current =
    latest[1];


  const recent =
    entries.slice(-3);


  let trend = 0;


  if (
    recent.length >= 2
  ) {

    trend =

      (
        recent[
          recent.length - 1
        ][1]

        -

        recent[0][1]
      )

      /

      (
        recent.length - 1
      );

  }


  return {

    entries,

    age,

    current,

    trend

  };

}



function setupMission() {

  const mission =
    missions[missionIndex];


  document
    .getElementById(
      "missionTitle"
    )
    .textContent =
      mission.title;


  document
    .getElementById(
      "missionDescription"
    )
    .textContent =
      mission.description;



  const grid =
    document.getElementById(
      "candidateGrid"
    );


  grid.innerHTML = "";



  mission
    .candidates
    .forEach(name => {

      const stats =
        getPlayerStats(name);


      const button =
        document.createElement(
          "button"
        );


      button.className =
        "candidate";


      button.innerHTML = `

        <strong>
          ${name}
        </strong>

        <span>
          현재 나이:
          ${stats.age}세
        </span>

        <span>
          최근 득점률:
          ${stats.current.toFixed(3)}
        </span>

        <span>
          최근 추세:
          ${stats.trend >= 0 ? "+" : ""}
          ${stats.trend.toFixed(3)}/년
        </span>

      `;


      button
        .addEventListener(
          "click",
          () =>
            selectCurrentPlayer(
              name,
              button
            )
        );


      grid
        .appendChild(
          button
        );

    });

}



function normalize(
  value,
  min,
  max
) {

  if (
    max === min
  ) {

    return 0.5;

  }


  return (
    value - min
  )
  /
  (
    max - min
  );

}



function selectCurrentPlayer(
  name,
  button
) {

  document
    .querySelectorAll(
      ".candidate"
    )
    .forEach(
      item =>
        item
          .classList
          .remove(
            "selected"
          )
    );


  button
    .classList
    .add(
      "selected"
    );



  const stats =
    getPlayerStats(name);



  document
    .getElementById(
      "selectedPlayerTitle"
    )
    .textContent =

    `${name}의 나이별 득점률`;



  const curvePoints = [];


  for (
    let x = 18;
    x <= 39;
    x += 0.1
  ) {

    curvePoints.push({

      x:
        Number(
          x.toFixed(1)
        ),

      y:
        agingFunction(x)

    });

  }



  if (
    currentPlayerChart
  ) {

    currentPlayerChart
      .destroy();

  }



  currentPlayerChart =
    new Chart(

      document.getElementById(
        "currentPlayerChart"
      ),

      {

        type: "line",


        data: {

          datasets: [


            {

              label: name,

              data:
                stats.entries.map(
                  ([x, y]) => ({
                    x,
                    y
                  })
                ),

              borderColor:
                "#9bd1ff",

              backgroundColor:
                "#9bd1ff",

              pointRadius: 4,

              borderWidth: 3,

              tension: 0.12

            },


            {

              label:
                "평균 에이징 커브",

              data:
                curvePoints,

              borderColor:
                "rgba(255,255,255,.4)",

              pointRadius: 0,

              borderDash:
                [6, 6],

              tension: 0.18

            }

          ]

        },


        options: {

          ...commonChartOptions(
            "나이",
            "득점률"
          ),

          parsing: false

        }

      }

    );



  const mission =
    missions[missionIndex];


  const all =
    mission
      .candidates
      .map(
        candidate => ({

          name:
            candidate,

          stats:
            getPlayerStats(
              candidate
            )

        })
      );



  const ages =
    all.map(
      item =>
        item.stats.age
    );


  const currents =
    all.map(
      item =>
        item.stats.current
    );


  const trends =
    all.map(
      item =>
        item.stats.trend
    );



  const minAge =
    Math.min(...ages);


  const maxAge =
    Math.max(...ages);


  const minCurrent =
    Math.min(...currents);


  const maxCurrent =
    Math.max(...currents);


  const minTrend =
    Math.min(...trends);


  const maxTrend =
    Math.max(...trends);



  all.forEach(item => {

    const youthScore =

      1 -

      normalize(
        item.stats.age,
        minAge,
        maxAge
      );


    const currentScore =

      normalize(
        item.stats.current,
        minCurrent,
        maxCurrent
      );


    const trendScore =

      normalize(
        item.stats.trend,
        minTrend,
        maxTrend
      );


    item.score =

      mission.weights.current
      *
      currentScore

      +

      mission.weights.trend
      *
      trendScore

      +

      mission.weights.youth
      *
      youthScore;

  });



  all.sort(
    (a, b) =>
      b.score - a.score
  );


  const recommended =
    all[0].name;



  const ageCurveValue =
    agingFunction(
      stats.age
    );


  const comparison =

    stats.current >=
    ageCurveValue

    ?

    "평균 에이징 커브보다 높은"

    :

    "평균 에이징 커브보다 낮은";



  const result =
    document.getElementById(
      "coachResult"
    );


  result.innerHTML = `

    <h3>
      ${name} 선택
    </h3>


    <p>

      현재 나이
      <b>${stats.age}세</b>,

      최근 득점률
      <b>${stats.current.toFixed(3)} G/GP</b>,

      최근 추세
      <b>
        ${stats.trend >= 0 ? "+" : ""}
        ${stats.trend.toFixed(3)}/년
      </b>

    </p>


    <p>

      현재 득점률은
      ${comparison}
      수준입니다.

    </p>


    <p>

      <b>
        이 미션의 데이터 점수 기준 추천 선수:
        ${recommended}
      </b>

    </p>


    <p class="note">

      이 결과는
      현재 득점률,
      최근 변화,
      나이를 이용한
      게임용 판단입니다.

      실제 미래 성적을
      의미하지 않습니다.

    </p>

  `;


  result
    .classList
    .remove(
      "hidden"
    );

}



document
  .getElementById(
    "nextMissionBtn"
  )
  .addEventListener(
    "click",
    () => {

      missionIndex =

        (
          missionIndex + 1
        )

        %

        missions.length;


      setupMission();

    }
  );

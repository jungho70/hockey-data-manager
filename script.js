const navButtons =
  document.querySelectorAll(".nav-btn");

const pages =
  document.querySelectorAll(".page");


let agingChart = null;
let quizChart = null;
let compareChart = null;

let currentQuiz = null;
let selectedQuizAnswer = null;
let lastQuizType = null;


/* =========================
   페이지 이동
========================= */

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

    if (!currentQuiz) {

      makeNextQuiz();

    }

    renderQuiz(false);

  }


  if (id === "compare") {

    setupCompare();

  }


  if (id === "gm") {

    if (!gmStarted) {

      startGMChallenge();

    }

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


/* =========================
   공통 함수
========================= */

function getSortedEntries(object) {

  return Object
    .entries(object)

    .map(([age, value]) => [

      Number(age),

      Number(value)

    ])

    .sort(
      (a, b) =>
        a[0] - b[0]
    );

}


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

          color:
            "rgba(159,176,196,.08)"

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

          color:
            "rgba(159,176,196,.08)"

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

  const curvePoints = [];


  for (
    let x = 20;
    x <= 33;
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
                "5차 다항회귀 에이징 커브",

              data:
                curvePoints,

              borderColor:
                "#63adff",

              pointRadius:
                0,

              borderWidth:
                3,

              tension:
                0.18

            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          parsing: false,

          scales: {

            x: {

              type: "linear",

              min: 20,

              max: 33,

              title: {

                display: true,

                text:
                  "나이 (Age)",

                color:
                  "#9fb0c4"

              },

              ticks: {

                color:
                  "#9fb0c4",

                stepSize:
                  1

              },

              grid: {

                color:
                  "rgba(159,176,196,.08)"

              }

            },


            y: {

              min: 0.63,

              max: 0.76,

              title: {

                display: true,

                text:
                  "득점률 (Goals per Game)",

                color:
                  "#9fb0c4"

              },

              ticks: {

                color:
                  "#9fb0c4"

              },

              grid: {

                color:
                  "rgba(159,176,196,.08)"

              }

            }

          },


          plugins: {

            legend: {

              labels: {

                color:
                  "#f4f7fb"

              }

            }

          }

        }

      }

    );

}



/* =========================
   예측 퀴즈
========================= */

function classifyChange(
  currentValue,
  futureAverage
) {

  if (
    futureAverage >
    currentValue * 1.07
  ) {

    return "up";

  }


  if (
    futureAverage <
    currentValue * 0.93
  ) {

    return "down";

  }


  return "flat";

}



function buildQuizCases() {

  const cases = [];


  Object
    .entries(
      HISTORICAL_PLAYERS
    )
    .forEach(
      ([name, data]) => {

        const entries =
          getSortedEntries(
            data
          );


        for (
          let cutIndex = 3;
          cutIndex <=
          entries.length - 4;
          cutIndex++
        ) {

          const currentAge =
            entries[cutIndex][0];


          const currentValue =
            entries[cutIndex][1];


          const future =
            entries.slice(
              cutIndex + 1,
              cutIndex + 4
            );


          const futureAverage =

            future.reduce(
              (sum, item) =>
                sum + item[1],
              0
            )

            /

            3;


          const type =
            classifyChange(
              currentValue,
              futureAverage
            );


          cases.push({

            name,

            entries,

            cutIndex,

            currentAge,

            currentValue,

            futureAverage,

            type

          });

        }

      }
    );


  return cases;

}


const ALL_QUIZ_CASES =
  buildQuizCases();


function randomItem(array) {

  return array[
    Math.floor(
      Math.random()
      *
      array.length
    )
  ];

}



function makeNextQuiz() {

  selectedQuizAnswer =
    null;


  let types =
    ["up", "flat", "down"];


  types =
    types.filter(type =>

      ALL_QUIZ_CASES.some(
        quiz =>
          quiz.type === type
      )

    );


  const different =
    types.filter(
      type =>
        type !==
        lastQuizType
    );


  if (
    different.length > 0
  ) {

    types =
      different;

  }


  const targetType =
    randomItem(types);


  const candidates =
    ALL_QUIZ_CASES.filter(
      quiz =>
        quiz.type ===
        targetType
    );


  currentQuiz =
    randomItem(
      candidates
    );


  lastQuizType =
    currentQuiz.type;


  document
    .getElementById(
      "quizResult"
    )
    .classList
    .add(
      "hidden"
    );

}



function renderQuiz(
  revealFuture = false
) {

  if (
    !currentQuiz
  ) {

    return;

  }


  document
    .getElementById(
      "quizPlayerName"
    )
    .textContent =
      currentQuiz.name;


  document
    .getElementById(
      "quizQuestion"
    )
    .textContent =

    `${currentQuiz.currentAge}세까지의 기록입니다. 이후 3시즌의 득점률은 어떻게 변할까요?`;


  let shown;


  if (
    revealFuture
  ) {

    shown =
      currentQuiz.entries.slice(
        0,
        currentQuiz.cutIndex + 4
      );

  }

  else {

    shown =
      currentQuiz.entries.slice(
        0,
        currentQuiz.cutIndex + 1
      );

  }


  if (
    quizChart
  ) {

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

              label:
                currentQuiz.name,

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

              pointRadius:
                5,

              borderWidth:
                3,

              tension:
                0.12

            }

          ]

        },


        options: {

          ...commonChartOptions(
            "나이",
            "득점률"
          ),

          parsing:
            false

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

        selectedQuizAnswer =
          button.dataset.answer;


        const labels = {

          up:
            "상승",

          flat:
            "비슷",

          down:
            "하락"

        };


        const result =
          document
            .getElementById(
              "quizResult"
            );


        result.innerHTML =

          `내 예측:
          <b>${labels[selectedQuizAnswer]}</b><br>
          실제 기록을 확인해보세요.`;


        result.classList.remove(
          "hidden"
        );

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

      if (
        !selectedQuizAnswer
      ) {

        const result =
          document
            .getElementById(
              "quizResult"
            );


        result.textContent =
          "먼저 상승, 비슷, 하락 중 하나를 선택해주세요.";


        result.classList.remove(
          "hidden"
        );


        return;

      }


      renderQuiz(true);


      const labels = {

        up:
          "상승",

        flat:
          "비슷",

        down:
          "하락"

      };


      const correct =

        selectedQuizAnswer ===
        currentQuiz.type;


      const result =
        document
          .getElementById(
            "quizResult"
          );


      result.innerHTML = `

        <h3>
          ${
            correct
            ?
            "예측 성공!"
            :
            "예측 실패"
          }
        </h3>

        <p>
          내 예측:
          <b>
            ${labels[selectedQuizAnswer]}
          </b>
        </p>

        <p>
          실제 흐름:
          <b>
            ${labels[currentQuiz.type]}
          </b>
        </p>

        <p>
          이후 3시즌 평균:
          <b>
            ${currentQuiz.futureAverage.toFixed(3)}
          </b>
        </p>

      `;


      result.classList.remove(
        "hidden"
      );

    }
  );



document
  .getElementById(
    "nextQuizBtn"
  )
  .addEventListener(
    "click",
    () => {

      makeNextQuiz();

      renderQuiz(false);

    }
  );



/* =========================
   선수 비교
========================= */

const compareSelect1 =
  document.getElementById(
    "comparePlayer1"
  );

const compareSelect2 =
  document.getElementById(
    "comparePlayer2"
  );

const compareSelect3 =
  document.getElementById(
    "comparePlayer3"
  );


let compareReady =
  false;



function fillCompareSelect(
  select,
  includeNone = false
) {

  if (
    includeNone
  ) {

    const none =
      document.createElement(
        "option"
      );

    none.value =
      "";

    none.textContent =
      "선택 안 함";

    select.appendChild(
      none
    );

  }


  Object
    .keys(
      CURRENT_PLAYERS
    )
    .forEach(name => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        name;

      option.textContent =
        name;


      select.appendChild(
        option
      );

    });

}



function setupCompare() {

  if (
    !compareReady
  ) {

    fillCompareSelect(
      compareSelect1
    );

    fillCompareSelect(
      compareSelect2
    );

    fillCompareSelect(
      compareSelect3,
      true
    );


    compareSelect1.value =
      "Connor McDavid";

    compareSelect2.value =
      "Auston Matthews";

    compareSelect3.value =
      "Connor Bedard";


    compareReady =
      true;

  }


  drawComparison();

}



function getPlayerSummary(
  name
) {

  const entries =
    getSortedEntries(
      CURRENT_PLAYERS[name]
    );


  const latest =
    entries[
      entries.length - 1
    ];


  const peak =
    entries.reduce(
      (best, item) =>
        item[1] >
        best[1]
        ?
        item
        :
        best
    );


  const recent =
    entries.slice(-3);


  let trend =
    0;


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

    age:
      latest[0],

    current:
      latest[1],

    peakAge:
      peak[0],

    peakValue:
      peak[1],

    trend

  };

}



function drawComparison() {

  const names = [

    compareSelect1.value,

    compareSelect2.value,

    compareSelect3.value

  ]
  .filter(
    name =>
      name !== ""
  );


  const uniqueNames =
    [...new Set(names)];


  if (
    compareChart
  ) {

    compareChart.destroy();

  }


  const colors = [

    "#63adff",

    "#f5b85b",

    "#79d8a4"

  ];


  const datasets =
    uniqueNames.map(
      (name, index) => {

        const summary =
          getPlayerSummary(
            name
          );


        return {

          label:
            name,

          data:
            summary.entries.map(
              ([x, y]) => ({
                x,
                y
              })
            ),

          borderColor:
            colors[index],

          backgroundColor:
            colors[index],

          pointRadius:
            4,

          borderWidth:
            3,

          tension:
            0.12

        };

      }
    );


  compareChart =
    new Chart(

      document.getElementById(
        "compareChart"
      ),

      {

        type:
          "line",

        data: {
          datasets
        },

        options: {

          ...commonChartOptions(
            "나이",
            "득점률"
          ),

          parsing:
            false

        }

      }

    );


  const stats =
    document.getElementById(
      "compareStats"
    );


  stats.innerHTML =
    "";


  uniqueNames.forEach(
    name => {

      const player =
        getPlayerSummary(
          name
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "card player-stat-card";


      card.innerHTML = `

        <h3>
          ${name}
        </h3>

        <p>
          현재 나이
          <b>
            ${player.age}세
          </b>
        </p>

        <p>
          최근 득점률
          <b>
            ${player.current.toFixed(3)}
          </b>
        </p>

        <p>
          개인 최고 득점률
          <b>
            ${player.peakValue.toFixed(3)}
          </b>
        </p>

        <p>
          최고 기록 나이
          <b>
            ${player.peakAge}세
          </b>
        </p>

        <p>
          최근 추세
          <b>
            ${
              player.trend >= 0
              ?
              "+"
              :
              ""
            }
            ${player.trend.toFixed(3)}
            /년
          </b>
        </p>

      `;


      stats.appendChild(
        card
      );

    }
  );

}



document
  .getElementById(
    "compareBtn"
  )
  .addEventListener(
    "click",
    drawComparison
  );



/* =========================
   GM 챌린지
========================= */

const gmMissions = [

  {

    title:
      "장기 리빌딩",

    description:
      "향후 5년 이상 팀의 중심이 될 젊은 공격수를 영입하세요.",

    candidates: [

      "Macklin Celebrini",

      "Connor Bedard",

      "Leo Carlsson",

      "Wyatt Johnston"

    ],

    weights: {

      current:
        0.30,

      trend:
        0.35,

      youth:
        0.35

    }

  },


  {

    title:
      "이번 시즌 우승",

    description:
      "미래보다 당장의 득점력이 중요합니다. 지금 가장 강한 선수를 선택하세요.",

    candidates: [

      "Connor McDavid",

      "Nathan MacKinnon",

      "Leon Draisaitl",

      "Auston Matthews"

    ],

    weights: {

      current:
        0.80,

      trend:
        0.15,

      youth:
        0.05

    }

  },


  {

    title:
      "안정적인 3년 계약",

    description:
      "현재 기록과 나이, 최근 흐름을 균형 있게 고려하세요.",

    candidates: [

      "Jack Hughes",

      "Auston Matthews",

      "Connor McDavid",

      "Nikita Kucherov"

    ],

    weights: {

      current:
        0.50,

      trend:
        0.25,

      youth:
        0.25

    }

  },


  {

    title:
      "성장 가능성 투자",

    description:
      "현재 기록보다 앞으로 더 성장할 가능성이 높은 선수를 선택하세요.",

    candidates: [

      "Connor Bedard",

      "Leo Carlsson",

      "Wyatt Johnston",

      "Jack Hughes"

    ],

    weights: {

      current:
        0.20,

      trend:
        0.45,

      youth:
        0.35

    }

  },


  {

    title:
      "최종 에이스 선정",

    description:
      "현재 실력과 나이, 최근 흐름을 종합해 팀의 최종 에이스를 선택하세요.",

    candidates: [

      "Connor McDavid",

      "Nathan MacKinnon",

      "Auston Matthews",

      "Jack Hughes"

    ],

    weights: {

      current:
        0.55,

      trend:
        0.25,

      youth:
        0.20

    }

  }

];


let gmStarted =
  false;

let gmRound =
  0;

let gmScore =
  0;

let gmAnswered =
  false;

let gmCorrectCount =
  0;



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

    (value - min)

    /

    (max - min)

  );

}



function scoreMission(
  mission
) {

  const players =
    mission.candidates.map(
      name => {

        const data =
          getPlayerSummary(
            name
          );


        return {

          name,

          ...data

        };

      }
    );


  const ages =
    players.map(
      player =>
        player.age
    );


  const currents =
    players.map(
      player =>
        player.current
    );


  const trends =
    players.map(
      player =>
        player.trend
    );


  const minAge =
    Math.min(...ages);

  const maxAge =
    Math.max(...ages);

  const minCurrent =
    Math.min(
      ...currents
    );

  const maxCurrent =
    Math.max(
      ...currents
    );

  const minTrend =
    Math.min(
      ...trends
    );

  const maxTrend =
    Math.max(
      ...trends
    );


  players.forEach(
    player => {

      const youth =
        1 -
        normalize(
          player.age,
          minAge,
          maxAge
        );


      const current =
        normalize(
          player.current,
          minCurrent,
          maxCurrent
        );


      const trend =
        normalize(
          player.trend,
          minTrend,
          maxTrend
        );


      player.score =

        mission.weights.current
        *
        current

        +

        mission.weights.trend
        *
        trend

        +

        mission.weights.youth
        *
        youth;

    }
  );


  players.sort(
    (a, b) =>
      b.score -
      a.score
  );


  return players;

}



function startGMChallenge() {

  gmStarted =
    true;

  gmRound =
    0;

  gmScore =
    0;

  gmCorrectCount =
    0;

  loadGMRound();

}



function loadGMRound() {

  gmAnswered =
    false;


  document
    .getElementById(
      "gmFeedback"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "gmNextBtn"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "gmFinal"
    )
    .classList.add(
      "hidden"
    );


  const mission =
    gmMissions[
      gmRound
    ];


  document
    .getElementById(
      "gmRound"
    )
    .textContent =

    `${gmRound + 1} / ${gmMissions.length}`;


  document
    .getElementById(
      "gmScore"
    )
    .textContent =
      gmScore;


  document
    .getElementById(
      "gmMissionTitle"
    )
    .textContent =
      mission.title;


  document
    .getElementById(
      "gmMissionDescription"
    )
    .textContent =
      mission.description;


  const grid =
    document.getElementById(
      "gmCandidateGrid"
    );


  grid.innerHTML =
    "";


  mission
    .candidates
    .forEach(name => {

      const player =
        getPlayerSummary(
          name
        );


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
          나이:
          ${player.age}세
        </span>

        <span>
          최근 득점률:
          ${player.current.toFixed(3)}
        </span>

        <span>
          최근 추세:
          ${
            player.trend >= 0
            ?
            "+"
            :
            ""
          }
          ${player.trend.toFixed(3)}
        </span>

      `;


      button.addEventListener(
        "click",
        () =>
          chooseGMPlayer(
            name
          )
      );


      grid.appendChild(
        button
      );

    });

}



function chooseGMPlayer(
  name
) {

  if (
    gmAnswered
  ) {

    return;

  }


  gmAnswered =
    true;


  const mission =
    gmMissions[
      gmRound
    ];


  const ranking =
    scoreMission(
      mission
    );


  const best =
    ranking[0];


  const selected =
    ranking.find(
      player =>
        player.name === name
    );


  const ratio =
    selected.score
    /
    best.score;


  let gainedScore;


  if (
    name ===
    best.name
  ) {

    gainedScore =
      100;

    gmCorrectCount++;

  }

  else if (
    ratio >=
    0.85
  ) {

    gainedScore =
      70;

  }

  else if (
    ratio >=
    0.70
  ) {

    gainedScore =
      40;

  }

  else {

    gainedScore =
      20;

  }


  gmScore +=
    gainedScore;


  document
    .getElementById(
      "gmScore"
    )
    .textContent =
      gmScore;


  const feedback =
    document.getElementById(
      "gmFeedback"
    );


  feedback.innerHTML = `

    <h3>
      ${name} 영입
    </h3>

    <p>
      이번 라운드 획득 점수:
      <b>
        +${gainedScore}
      </b>
    </p>

    <p>
      데이터 기준 가장 높은 평가:
      <b>
        ${best.name}
      </b>
    </p>

    <p>
      이 평가는 해당 미션에서
      현재 득점률, 최근 변화 추세,
      나이에 서로 다른 가중치를 적용해 계산한 결과입니다.
    </p>

  `;


  feedback.classList.remove(
    "hidden"
  );


  const next =
    document.getElementById(
      "gmNextBtn"
    );


  next.classList.remove(
    "hidden"
  );


  if (
    gmRound ===
    gmMissions.length - 1
  ) {

    next.textContent =
      "최종 결과 보기";

  }

  else {

    next.textContent =
      "다음 라운드";

  }

}



document
  .getElementById(
    "gmNextBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        gmRound <
        gmMissions.length - 1
      ) {

        gmRound++;

        loadGMRound();

      }

      else {

        showGMFinal();

      }

    }
  );



function showGMFinal() {

  document
    .getElementById(
      "gmMissionCard"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "gmCandidateGrid"
    )
    .innerHTML =
      "";


  document
    .getElementById(
      "gmFeedback"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "gmNextBtn"
    )
    .classList.add(
      "hidden"
    );


  let title;
  let message;


  if (
    gmScore >=
    450
  ) {

    title =
      "데이터 분석형 GM";

    message =
      "현재 기록과 성장 가능성을 매우 잘 분석했습니다.";

  }

  else if (
    gmScore >=
    350
  ) {

    title =
      "균형형 GM";

    message =
      "현재 실력과 미래 가능성을 비교적 균형 있게 판단했습니다.";

  }

  else if (
    gmScore >=
    250
  ) {

    title =
      "직감형 GM";

    message =
      "몇몇 선택은 데이터 기준과 달랐지만 자신만의 판단 기준이 있었습니다.";

  }

  else {

    title =
      "도전형 GM";

    message =
      "데이터 기준과 다른 선택이 많았습니다. 선수 비교실을 활용해 다시 도전해보세요.";

  }


  const final =
    document.getElementById(
      "gmFinal"
    );


  final.innerHTML = `

    <p class="small-title">
      FINAL RESULT
    </p>

    <h2>
      ${title}
    </h2>

    <div class="final-score">
      ${gmScore} / 500
    </div>

    <p>
      ${message}
    </p>

    <p>
      데이터 기준 최고 선택과 일치:
      <b>
        ${gmCorrectCount} / 5
      </b>
    </p>

    <button
      id="restartGMBtn"
      class="primary">

      다시 도전하기

    </button>

  `;


  final.classList.remove(
    "hidden"
  );


  document
    .getElementById(
      "restartGMBtn"
    )
    .addEventListener(
      "click",
      () => {

        document
          .getElementById(
            "gmMissionCard"
          )
          .classList.remove(
            "hidden"
          );


        startGMChallenge();

      }
    );

}

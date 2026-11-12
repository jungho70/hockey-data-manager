const navButtons =
  document.querySelectorAll(".nav-btn");

const pages =
  document.querySelectorAll(".page");

let agingChart = null;
let quizChart = null;
let currentPlayerChart = null;

let missionIndex = 0;


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

      nextQuizQuestion();

    }

    else {

      drawQuizChart(false);

    }

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



/* =========================
   5차 다항회귀식
========================= */

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



/* =========================
   공통 함수
========================= */

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

              backgroundColor:
                "#63adff",

              pointRadius: 0,

              borderWidth: 3,

              tension: 0.18

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

                text: "나이 (Age)",

                color: "#9fb0c4"

              },

              ticks: {

                color: "#9fb0c4",

                stepSize: 1

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

        }

      }

    );

}



/* =========================
   예측 퀴즈
========================= */

let currentQuiz = null;

let selectedQuizAnswer = null;

let previousQuizType = null;



/*
   예측 기준

   현재 시점의 득점률과
   이후 3시즌 평균을 비교

   7% 이상 증가 → 상승
   7% 이상 감소 → 하락
   그 사이 → 비슷
*/

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



/*
   만들 수 있는 모든 퀴즈 후보 생성

   최소 조건:
   - 앞부분 기록 최소 4개
   - 이후 실제 기록 최소 3개
*/

function createQuizCases() {

  const cases = [];


  Object
    .entries(HISTORICAL_PLAYERS)
    .forEach(
      ([name, data]) => {

        const entries =
          getSortedEntries(data);


        /*
           cutIndex = 현재까지 공개할
           마지막 데이터 위치
        */

        for (
          let cutIndex = 3;
          cutIndex <= entries.length - 4;
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


          if (
            future.length < 3
          ) {

            continue;

          }


          const futureAverage =

            future.reduce(

              (sum, item) =>
                sum + item[1],

              0

            )

            /

            future.length;


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

            future,

            futureAverage,

            type

          });

        }

      }
    );


  return cases;

}



const QUIZ_CASES =
  createQuizCases();



function randomItem(array) {

  return array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];

}



/*
   다음 문제 생성

   직전 문제와 같은
   상승/비슷/하락 유형이
   계속 나오지 않도록 함
*/

function nextQuizQuestion() {

  selectedQuizAnswer = null;


  const possibleTypes =
    ["up", "flat", "down"]
      .filter(
        type => {

          const exists =
            QUIZ_CASES.some(
              quiz =>
                quiz.type === type
            );


          if (!exists) {

            return false;

          }


          if (
            previousQuizType &&
            type === previousQuizType
          ) {

            return false;

          }


          return true;

        }
      );


  let targetType;


  if (
    possibleTypes.length > 0
  ) {

    targetType =
      randomItem(
        possibleTypes
      );

  }

  else {

    targetType =
      randomItem(
        ["up", "flat", "down"]
      );

  }


  const candidates =
    QUIZ_CASES.filter(
      quiz =>
        quiz.type === targetType
    );


  currentQuiz =
    randomItem(
      candidates
    );


  previousQuizType =
    currentQuiz.type;


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

    `${currentQuiz.currentAge}세까지의 기록입니다. 이후 3시즌의 득점률 흐름은 어떻게 변할까요?`;


  document
    .getElementById(
      "quizResult"
    )
    .classList
    .add("hidden");


  document
    .querySelectorAll(
      ".choice"
    )
    .forEach(
      button => {

        button.classList.remove(
          "selected"
        );

      }
    );


  drawQuizChart(false);

}



/*
   퀴즈 그래프

   revealed = false
   → 현재 나이까지만

   revealed = true
   → 이후 3시즌까지 공개
*/

function drawQuizChart(
  revealed
) {

  if (!currentQuiz) {

    return;

  }


  let shownEntries;


  if (revealed) {

    shownEntries =
      currentQuiz.entries.slice(
        0,
        currentQuiz.cutIndex + 4
      );

  }

  else {

    shownEntries =
      currentQuiz.entries.slice(
        0,
        currentQuiz.cutIndex + 1
      );

  }


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

              label:
                currentQuiz.name,

              data:
                shownEntries.map(
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

              borderWidth: 3,

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



/*
   상승 / 비슷 / 하락 선택
*/

document
  .querySelectorAll(
    ".choice"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          selectedQuizAnswer =
            button.dataset.answer;


          document
            .querySelectorAll(
              ".choice"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "selected"
                );

              }
            );


          button.classList.add(
            "selected"
          );


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

            `내 예측:
            <b>${labels[selectedQuizAnswer]}</b><br>
            실제 기록을 확인해보세요.`;


          result
            .classList
            .remove("hidden");

        }
      );

    }
  );



/*
   실제 기록 확인
*/

document
  .getElementById(
    "revealBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (!currentQuiz) {

        return;

      }


      if (!selectedQuizAnswer) {

        const result =
          document.getElementById(
            "quizResult"
          );


        result.textContent =
          "먼저 상승, 비슷, 하락 중 하나를 선택해주세요.";


        result
          .classList
          .remove("hidden");


        return;

      }


      drawQuizChart(true);


      const labels = {

        up: "상승",

        flat: "비슷",

        down: "하락"

      };


      const correct =
        selectedQuizAnswer ===
        currentQuiz.type;


      const result =
        document.getElementById(
          "quizResult"
        );


      result.innerHTML = `

        <h3>
          ${correct ? "예측 성공!" : "예측 실패"}
        </h3>

        <p>
          내 예측:
          <b>${labels[selectedQuizAnswer]}</b>
        </p>

        <p>
          실제 흐름:
          <b>${labels[currentQuiz.type]}</b>
        </p>

        <p>
          ${currentQuiz.currentAge}세 득점률:
          <b>${currentQuiz.currentValue.toFixed(3)}</b>
        </p>

        <p>
          이후 3시즌 평균:
          <b>${currentQuiz.futureAverage.toFixed(3)}</b>
        </p>

      `;


      result
        .classList
        .remove("hidden");

    }
  );



/*
   다음 랜덤 문제
*/

document
  .getElementById(
    "nextQuizBtn"
  )
  .addEventListener(
    "click",
    () => {

      nextQuizQuestion();

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


  document
    .getElementById(
      "coachResult"
    )
    .classList
    .add("hidden");


  document
    .getElementById(
      "selectedPlayerTitle"
    )
    .textContent =
      "선수를 선택하면 그래프가 표시됩니다.";


  const grid =
    document.getElementById(
      "candidateGrid"
    );


  grid.innerHTML = "";


  mission
    .candidates
    .forEach(
      name => {

        const stats =
          getPlayerStats(
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


        button.addEventListener(
          "click",
          () =>
            selectCurrentPlayer(
              name,
              button
            )
        );


        grid.appendChild(
          button
        );

      }
    );

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

    (value - min)

    /

    (max - min)

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
      item => {

        item.classList.remove(
          "selected"
        );

      }
    );


  button.classList.add(
    "selected"
  );


  const stats =
    getPlayerStats(
      name
    );


  document
    .getElementById(
      "selectedPlayerTitle"
    )
    .textContent =

    `${name}의 나이별 득점률`;



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


  if (
    currentPlayerChart
  ) {

    currentPlayerChart.destroy();

  }


  currentPlayerChart =
    new Chart(

      document.getElementById(
        "currentPlayerChart"
      ),

      {

        type:
          "line",


        data: {

          datasets: [

            {

              label:
                name,

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

              pointRadius:
                4,

              borderWidth:
                3,

              tension:
                0.12

            },


            {

              label:
                "평균 에이징 커브",

              data:
                curvePoints,

              borderColor:
                "rgba(255,255,255,.4)",

              pointRadius:
                0,

              borderDash:
                [6, 6],

              tension:
                0.18

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



  const mission =
    missions[
      missionIndex
    ];


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
    Math.min(
      ...ages
    );


  const maxAge =
    Math.max(
      ...ages
    );


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


  all.forEach(
    item => {

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

    }
  );


  all.sort(
    (a, b) =>
      b.score - a.score
  );


  const recommended =
    all[0].name;


  const ageCurveValue =

    stats.age >= 20 &&
    stats.age <= 33

    ?

    agingFunction(
      stats.age
    )

    :

    null;


  let comparisonText;


  if (
    ageCurveValue !== null
  ) {

    const comparison =

      stats.current >=
      ageCurveValue

      ?

      "평균 에이징 커브보다 높은"

      :

      "평균 에이징 커브보다 낮은";


    comparisonText =

      `현재 득점률은 같은 나이의 ${comparison} 수준입니다.`;

  }

  else {

    comparisonText =

      "현재 나이가 평균 에이징 커브의 분석 범위 밖이어서 직접 비교하지 않았습니다.";

  }


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
      ${comparisonText}
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

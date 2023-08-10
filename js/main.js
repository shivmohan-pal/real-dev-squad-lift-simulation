
const lifts = document.querySelector('.lifts');
const floors = document.querySelector('.floors');
const form = document.querySelector('form');
const floorInput = document.querySelector("input[name='floors']");
const liftInput = document.querySelector("input[name='lifts']");

// -------------------------fucntions & classes---------------------------------

class liftData {
    constructor() {
        this.liftPos = 0;
        this.direction = null;// up or down
        this.active = false;
        this.destinations = [];
    }

    addDestination(floorNo, cD) {
        this.destinations.push(parseInt(floorNo));
        this.destinations = cD == this.direction ? sortedSet(this.destinations, this.direction) : this.destinations;
    }

    async completeDestiny(lift) {
        this.active = true;
        while (this.destinatyLength()) {
            let d = Number(this.destinations[0]);
            if (!(this.destinations[0] === this.liftPos)) {
                let duration = callLift(lift, this.destinations[0], this.liftPos);
                setLiftPos(this, duration);
                await delay(duration * 1000);
            }
            this.destinations = this.destinations.filter((elm) => elm != d);
            openDoors(lift);
            await delay();
            closeDoors(lift);
            await delay();
        }
        this.active = false;
        this.direction = null;
    }

    destinatyLength = () => this.destinations.length;
}

const dataStore = {};
var liftLength = 0;
var floorLength = 0;

const sortedSet = (ar, cD) => {
    ar.sort((a, b) => cD == "Up" ? a - b : b - a);
    let set = new Set(ar);
    return [...set];
}
const liftNoEntry = (No) => `lift_${No}`;
const getLiftIdNo = (lift) => parseInt(lift.getAttribute('id').slice(5));
const getElementById = (id) => document.querySelector(`#${id}`);
const twoNoDiff = (a, b) => Math.abs(parseInt(a) - parseInt(b));// Positive difference between two numbers
const speed = (distance, time = 2) => distance * time; // distance * time (2sec) time in secounds

const createElement = (tag, classArray, textContext) => {
    const element = document.createElement(tag);
    classArray?.length && element.classList.add(...classArray);
    if (textContext) element.textContent = textContext;
    return element;
}

const createFloor = (floorNo) => {
    const [buttons, floor] = [createElement('div', ['buttons']), createElement('div', ['floor'])];
    const [upButton, downButton] = [createElement("button", ['up'], 'Up'), createElement("button", ['down'], 'Down')];
    const floorCount = createElement('span', ["floor-count"], `Floor ${floorNo}`);
    buttons.append(upButton, downButton);
    floor.append(buttons);
    floor.append(floorCount);
    floor.setAttribute('data-floor', `${floorNo}`);
    return floor;
}

const createLift = (liftNo) => {
    const [lift, doors, leftDoor, rightDoor] = [
        createElement("div", ["lift"]),
        createElement("div", ["doors"]),
        createElement("div", ["left-door"]),
        createElement("div", ["right-door"])
    ];
    doors.append(leftDoor, rightDoor);
    lift.append(doors);
    lift.setAttribute('id', `lift-${liftNo}`);
    return lift;
}

const callLift = (lift, floorNo, liftPos) => {
    const liftHeight = lift.offsetHeight;
    const duration = speed(twoNoDiff(floorNo, liftPos));
    lift.style.transition = `transform ${duration}s linear`;
    lift.style.transform = `translateY(-${liftHeight * floorNo}px)`;

    return duration;
}

const isLiftOnSameFloor = (floorNo) => {
    for (let i = 0; i < liftLength; i++) {
        let lift = getElementById(`lift-${i}`);
        let { liftPos, direction } = dataStore[liftNoEntry(i)];
        if (direction == null) {
            if (floorNo == liftPos) return [lift];
        }
    }
    return false;
}

const nearestLift = (floorNo, callDirection) => {
    let lift = getElementById(`lift-0`);
    let maxDistance = Number(floorLength);
    for (let i = 0; i < liftLength; i++) {
        let { liftPos, direction } = dataStore[liftNoEntry(i)];
        let distance = twoNoDiff(floorNo, liftPos);
        let onSameFloor = isLiftOnSameFloor(floorNo);
        if (onSameFloor) return onSameFloor[0];
        else if (maxDistance > distance) {
            maxDistance = distance;
            lift = getElementById(`lift-${i}`);
        }
        else {
            let { ...store } = dataStore[liftNoEntry(i - 1)];
            if (callDirection === direction) {
                if (store.direction == "Up" && store.liftPos > floorNo) continue;
                if (store.direction == "Down" && store.liftPos < floorNo) continue;
            }
            if (store.direction != null && store.direction != callDirection) continue;
            lift = getElementById(`lift-${i - 1}`);
            break;
        }
    }

    return lift;
}

async function setLiftPos(lift, travelTime) {
    let count = travelTime / 2;
    while (count) {
        if (lift.destinations[0] < lift.liftPos) lift.liftPos--;
        else if (lift.destinations[0] > lift.liftPos) lift.liftPos++;
        await delay(2000);
        count--;
    }
}

function delay(miliseconds) {
    miliseconds = miliseconds || 2500;
    return new Promise(done => {
        setTimeout(() => {
            done();
        }, miliseconds);
    });
}

function openDoors(lift) {
    lift.children[0].children[0].classList.add("open");
    lift.children[0].children[1].classList.add("open");
}

function closeDoors(lift) {
    lift.children[0].children[0].classList.remove("open");
    lift.children[0].children[1].classList.remove("open");
}

function createFloors_Lifts(floorCount, liftCount) {
    let floorArray = [];
    let liftArray = [];
    let count = Math.max(floorCount, liftCount);
    for (let i = 0; i < count; i++) {
        floorCount > i && floorArray.unshift(createFloor(i));
        if (liftCount > i) {
            liftArray.push(createLift(i));
            dataStore[liftNoEntry(i)] = new liftData();
        }
    }
    floors.append(...floorArray);
    lifts.append(...liftArray);
}

// ---------------------exexutions-----------------------------------------

form.addEventListener("submit", function (e) {
    e.preventDefault();
    createFloors_Lifts(floorInput.value, liftInput.value);
    liftLength = liftInput.value;
    floorLength = floorInput.value;
    form.style.display = 'none';
    Generate();
});

function Generate() {
    var floorButtons = document.querySelectorAll(".floor .buttons");

    floorButtons.forEach((element) => {
        let floorNo = parseInt(element.parentElement.getAttribute("data-floor"));
        let childButtons = element.children;
        [...childButtons].forEach((elem) => {
            elem.addEventListener('click', function () {
                let callDirection = String(elem.textContent);
                let lift = nearestLift(floorNo, callDirection);
                let liftStore = dataStore[liftNoEntry(getLiftIdNo(lift))];
                liftStore.direction = liftStore.direction == null ? callDirection : liftStore.direction;
                liftStore.addDestination(floorNo, callDirection);
                if (!liftStore.active) {
                    liftStore.completeDestiny(lift);
                }
            })
        })

    })

}

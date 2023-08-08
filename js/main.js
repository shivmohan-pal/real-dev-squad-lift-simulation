
const lifts = document.querySelector('.lifts');
const floors = document.querySelector('.floors');
const form = document.querySelector('form');
const floorInput = document.querySelector("input[name='floors']");
const liftInput = document.querySelector("input[name='lifts']");

// -------------------------fucntions & classes---------------------------------

class liftDataStore {
    constructor() {
        this.liftPos = 0;
        this.direction = null;// up or down
        this.active = false;
        this.destinations = [];
    }

    addDestination(floorNo) {
        this.destinations.push(parseInt(floorNo));
        this.destinations = sortedSet(this.destinations);
    }

    async completeDestiny(lift) {
        while (this.destinatyLength()) {
            if (!(this.destinations[0] === this.liftPos)) {
                let duration = callLift(lift, this.destinations[0], this.liftPos);
                liftPositioning(this, duration, lift);
                await delay(duration * 1000);
            }
            openDoors(lift);
            await delay();
            closeDoors(lift);
            await delay();
            this.liftPos = this.destinations.shift();
        }
        this.active = false;
        this.direction = null;
    }
    
    destinatyLength = () => this.destinations.length;
}

const dataStore = {};
var liftLength = 0;

const sortedSet = (ar) => {
    ar.sort((a, b) => a - b);
    let set = new Set(ar);
    return [...set];
}
const randomNumber = (range = 1) => Math.floor(Math.random() * range);
const getLiftIdNo = (lift) => parseInt(lift.getAttribute('id').slice(5));
const getElementById = (id) => document.querySelector(`#${id}`);
const twoNoDiff = (a, b) => Math.abs(parseInt(a) - parseInt(b));// Positive difference between two numbers
const speed = (distance, time = 2) => distance * time; // distance * time (2sec) time in secounds

function delay(miliseconds) {
    miliseconds = miliseconds || 2500;
    return new Promise(done => {
        setTimeout(() => {
            done();
        }, miliseconds);
    });
}

async function liftPositioning(lift, travelTime,liftElement) {
    let count = travelTime / 2;
    while (count) {
        await delay(2000);
        lift.destinations[0] < lift.liftPos && lift.liftPos--;
        lift.destinations[0] > lift.liftPos && lift.liftPos++;
        liftElement.setAttribute('data-current-floor', `${lift.liftPos}`);
        count--;
    }
}

function createElement(tag, classArray, textContext) {
    const element = document.createElement(tag);
    classArray?.length && element.classList.add(...classArray);
    if (textContext) element.textContent = textContext;
    return element;
}

function openDoors(lift) {
    lift.children[0].children[0].classList.add("open");
    lift.children[0].children[1].classList.add("open");
}

function closeDoors(lift) {
    lift.children[0].children[0].classList.remove("open");
    lift.children[0].children[1].classList.remove("open");
}

function createFloorsLifts(floorCount, liftCount) {
    let floorArray = [];
    let liftArray = [];
    let count = Math.max(floorCount, liftCount);
    for (let i = 0; i < count; i++) {
        floorCount > i && floorArray.unshift(createFloor(i));
        if (liftCount > i) {
            liftArray.push(createLift(i));
            dataStore[`lift_${i}`] = new liftDataStore();
        }
    }
    floors.append(...floorArray);
    lifts.append(...liftArray);
}

function createFloor(floorNo) {
    const [buttons, floor] = [createElement('div', ['buttons']), createElement('div', ['floor'])];
    const [upButton, downButton] = [createElement("button", ['up'], 'Up'), createElement("button", ['down'], 'Down')];
    const floorCount = createElement('span', ["floor-count"], `Floor ${floorNo}`);
    buttons.append(upButton, downButton);
    floor.append(buttons);
    floor.append(floorCount);
    floor.setAttribute('data-floor', `${floorNo}`);
    return floor;
}

function createLift(liftNo) {
    const [lift, doors, leftDoor, rightDoor] = [
        createElement("div", ["lift"]),
        createElement("div", ["doors"]),
        createElement("div", ["left-door"]),
        createElement("div", ["right-door"])
    ];
    doors.append(leftDoor, rightDoor);
    lift.append(doors);
    lift.setAttribute('id', `lift-${liftNo}`);
    lift.setAttribute('data-current-floor', '0');
    return lift;
}

function nearestLift(liftLength, floorNo,callDirection) {
    let i = 0;
    let maxDistance = liftLength;
    let lift = getElementById(`lift-${i}`);
    while (i < liftLength) {
        let liftNo = `lift_${i}`;
        let { liftPos ,direction} = dataStore[liftNo];
        let distance = twoNoDiff(floorNo, liftPos)
        if(callDirection==direction || !direction){
        if (maxDistance > distance) {
            maxDistance = distance;
            lift = getElementById(`lift-${i}`);
        }}
        i++;
    }
    return lift;
}

function chooseLift(callDirection, floorNo) {
    for (let i = 0; i < liftLength; i++) {
        let lift = getElementById(`lift-${i}`);
        let liftNo = `lift_${i}`;
        let { liftPos, active, direction } = dataStore[liftNo];
        if (!active) {
            if (liftPos == floorNo) return lift;
            return nearestLift(liftLength, floorNo);
        }
        else {
            if(callDirection==direction){
            if (callDirection == 'Up') {
                if(liftPos < floorNo) return nearestLift(liftLength,floorNo,callDirection);
            }
            else {
                if(liftPos > floorNo) return nearestLift(liftLength,floorNo,callDirection);
            }}
        }
    }
 // return document.querySelector(`#lift-${randomNumber(liftLength)}`);//if no lift selected  (bug)
}

function callLift(lift, floorNo, liftPos) {
    const liftHeight = lift.offsetHeight;
    const duration = speed(twoNoDiff(floorNo, liftPos));
    lift.style.transition = `transform ${duration}s linear`;
    lift.style.transform = `translateY(-${liftHeight * floorNo}px)`;

    return duration;
}

// ---------------------exexutions-----------------------------------------

form.addEventListener("submit", function (e) {
    e.preventDefault();
    createFloorsLifts(floorInput.value, liftInput.value);
    liftLength = liftInput.value;
    form.style.display = 'none';
    Generate();
});

function Generate() {
    var floorButtons = document.querySelectorAll(".floor .buttons");

    floorButtons.forEach((element) => {
        let floorNo = element.parentElement.getAttribute("data-floor");
        let childButtons = element.children;
        [...childButtons].forEach((elem) => {
            elem.addEventListener('click', function () {
                let callDirection = elem.textContent;
                let lift = chooseLift(callDirection, floorNo);
                let liftNo = getLiftIdNo(lift);
                let liftStore = dataStore[`lift_${liftNo}`];
                liftStore.direction =  !liftStore.direction? callDirection : liftStore.direction;
                console.log(liftStore.direction);
                liftStore.addDestination(floorNo);
                if (!liftStore.active) {
                    liftStore.completeDestiny(lift);
                    liftStore.active = true;
                }
            })
        })

    })

}

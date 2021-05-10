import randomInt from 'random-int';

const animationTime = 1900;
let counter = 0;
let maxCounter = 4;
export function renderErrorChar(parent: HTMLElement, char: string) {
    if (!parent) {
        return;
    }
    const span = document.createElement('span');
    span.classList.add('error-char');
    span.innerText = char;
    span.style.position = 'fixed';
    // span.style.color = 'red';
    span.style.left = parent.offsetLeft + parent.offsetWidth / 2 + 'px';
    span.style.top = parent.offsetTop + 'px';
    span.style.animation = `error-char-${(++counter > maxCounter ? counter = 0 : counter)} ${animationTime}ms`;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), animationTime)
}

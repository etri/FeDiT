'use strict';
const PROGRESS_BAR = document.getElementById('loading') ? document.getElementById('loading') : document.querySelector('.wrap-loading');
document.addEventListener('DOMContentLoaded', function () {
    console.log('progress.js imported', PROGRESS_BAR);
    console.log(isProgressBar({element: null}));
});

const showProgressBar = ({element, process_id}) => {
    element = element || PROGRESS_BAR;
    // Add logic for showing the progress bar if needed
    console.log(`Showing progress bar for process ${process_id}`);
    let processes = element.dataset.processes ? element.dataset.processes.split(',') : [];
    processes.push(process_id);
    console.log('processes', processes);
    element.dataset.processes = processes.join(',');
    if (element.id === 'loading') {
        element.style.display = null;
    } else {
        if (element.classList.contains('display-none')) {
            element.classList.remove('display-none');
        }
    }
}

const closeProgressBar = ({element, process_id}) => {
    element = element || PROGRESS_BAR;
    // Add logic for closing the progress bar if needed
    console.log(`Closing progress bar for process ${process_id}`);
    let processes = element.dataset.processes ? element.dataset.processes.split(',') : [];
    console.log('processes', processes);
    // Remove the process_id from the array
    processes = processes.filter(id => id !== process_id);
    console.log('processes after removal:', processes);
    element.dataset.processes = processes.join(',');
    if (processes.length === 0) {
        if (element.id === 'loading') {
            element.style.display = 'none';
        } else {
            if (!element.classList.contains('display-none')) {
                element.classList.add('display-none');
            }
        }
    }
}

const isIdProgressBar = ({element, process_id}) => {
    element = element || PROGRESS_BAR;

    // Get the processes array from element.dataset.processes
    let processes = element.dataset.processes ? element.dataset.processes.split(',') : [];
    console.log('Checking progress bar for process:', process_id);
    console.log('Current processes:', processes);

    // Check if the process_id exists in the processes array
    return processes.includes(process_id);
};

const isProgressBar = ({element}) => {
    element = element || PROGRESS_BAR;

    // Get the processes array from element.dataset.processes
    let processes = element.dataset.processes ? element.dataset.processes.split(',') : [];
    console.log('Current processes:', processes);

    // Check if the process_id exists in the processes array
    return processes.length !== 0;
};
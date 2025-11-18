'use strict';

class PreProcessInterpolateTable {
    constructor(options = {}) {
        // 기본 옵션 설정
        this.defaultOptions = {
            container: document.querySelector('#preProcessInterpolateTableContainer'),
            headers: [],
            infos: [],
            columns: ['#', 'COLUMN', 'COUNT'],
            case: 'upper', // 'upper', 'lower', 'origin'
            type: 'basic', // 'basic', 'decision'
            initialize: (options) => console.log('initialize', 'options', options),
            handleInputChange: (options) => console.log('handleInputChange', options),
            supports: [],
        };

        // 사용자 정의 옵션 병합
        this.options = {...this.defaultOptions, ...options};

        // 커스텀 초기화 메서드 덮어쓰기
        this.options.initialize = options.initialize || this.defaultOptions.initialize;
        this.options.handleInputChange = options.handleInputChange || this.defaultOptions.handleInputChange;
        // 컬럼 및 헤더 케이스 변경
        this.options.columns = this.applyCaseTransform(this.options.columns, this.options.case);
        this.options.headers = this.applyCaseTransform(this.options.headers, this.options.case);

        // 테이블 생성 및 초기화
        this.build();
    }

    applyCaseTransform(items, caseType) {
        return items.map(item => {
            switch (caseType) {
                case 'upper':
                    return item.toUpperCase();
                case 'lower':
                    return item.toLowerCase();
                case 'origin':
                default:
                    return item;
            }
        });
    }

    createTable() {
        const table = this.createElementWithClasses('table', ['data-table']);
        const thead = this.createTableHead(this.options.columns);
        const tbody = this.createTableBody(this.options.headers, this.options.columns);

        table.appendChild(thead);
        table.appendChild(tbody);
        this.options.container.appendChild(table);
    }

    createTableHead(columns) {
        const thead = document.createElement('thead');
        const thead_tr = document.createElement('tr');

        columns.forEach(column => {
            const th = document.createElement('th');
            th.setAttribute('scope', 'col');
            th.innerHTML = column;
            thead_tr.appendChild(th);
        });

        thead.appendChild(thead_tr);
        return thead;
    }

    createTableBody(headers, columns) {
        const tbody = document.createElement('tbody');

        headers.forEach((header, index) => {
            const tbody_tr = this.createBodyTr(header, index, columns);
            tbody.appendChild(tbody_tr);
        });

        return tbody;
    }

    createBodyTr(header, index, columns) {
        const tbody_tr = document.createElement('tr');
        tbody_tr.dataset.column = header;

        columns.forEach(column => {
            const cell = this.createTableCell(column, header, index);
            tbody_tr.appendChild(cell);
        });

        return tbody_tr;
    }

    createTableCell(column, header, index) {
        let cell;

        switch (column) {
            case '#':
                cell = document.createElement('td');
                cell.setAttribute('scope', 'row');
                cell.innerHTML = index + 1;
                break;

            case 'COLUMN':
                cell = this.createElementWithText('td', header);
                break;

            case 'COUNT':
                cell = this.createElementWithText('td', this.getHeaderInfo(header, 'nan') || 0);
                cell.dataset.emptyCount = this.getHeaderInfo(header, 'nan') || 0;
                break;

            case '컬럼 선택':
            case '보간 입력 항목':
            case '보간 대상 항목':
                cell = this.createElementWithInput(column, header);
                break;
        }

        return cell;
    }

    getHeaderInfo(header, key) {
        const info = this.options.infos.find(info => {
            return info[header];
        });
        return info ? info[header][key] : null;
    }

    createElementWithInput(type, header) {
        const cell = document.createElement('td');
        const inputType = type === '보간 대상 항목' ? 'radio' : 'checkbox';
        const input = this.createInputElement(inputType, header, type);
        cell.appendChild(input);
        return cell;
    }

    createInputElement(type, header, dataType) {
        let inputContainer = document.createElement('div');
        ['form-checkbox'].forEach(function (className) {
            inputContainer.classList.add(className);
        });
        inputContainer.style.display = 'inline-block';

        let input = document.createElement('input');
        input.id = `decision_${header}_${type === 'radio' ? 'radio' : 'checkbox'}`;
        input.setAttribute('type', type);
        input.setAttribute('name', type === 'radio' ? 'select_radio' : 'select_checkbox');
        input.dataset.column = header;
        input.dataset.type = this.options.type;
        input.setAttribute('aria-label', `Input for ${header}`);
        input.addEventListener('change', this.handleInputChange.bind(this));

        ['ui-check'].forEach(function (className) {
            input.classList.add(className);
        });

        let label = document.createElement('label');
        ['form-label'].forEach(function (className) {
            label.classList.add(className);
        });
        label.setAttribute('for', `decision_${header}_${type === 'radio' ? 'radio' : 'checkbox'}`);
        label.id = `decision_${header}_${type === 'radio' ? 'radio' : 'checkbox'}_label`;
        label.style.margin = '0';
        inputContainer.appendChild(input);
        inputContainer.appendChild(label);

        return inputContainer;
    }

    handleInputChange(event) {
        console.log(`${event.target.type} changed`, event.target);
        this.options.handleInputChange(event, event.target, this.options);
    }

    createElementWithText(tag, text) {
        const element = document.createElement(tag);
        element.innerHTML = text;
        return element;
    }

    createElementWithClasses(tag, classes) {
        const element = document.createElement(tag);
        classes.forEach(cls => element.classList.add(cls));
        return element;
    }

    deleteHeaders(headers) {
        console.log('Headers to delete:', headers);

        this.options.headers = this.options.headers.filter(header => !headers.includes(header));
        this.refreshUI();
    }

    changeCountValue(column, value) {
        column = this.applyCaseTransform([column], this.options.case);
        let rowElement = this.options.container.querySelector(`tbody tr[data-column=${column}]`);
        let countCell = rowElement.querySelector('td[data-empty-count]');
        countCell.dataset.emptyCount = value;
        countCell.innerHTML = `${value}`;
    }

    changeColumns(type, columns) {
        this.options.type = type;
        this.options.columns = columns;
        this.refreshUI();
    }

    refreshUI() {
        console.log('Refreshing UI');
        this.clearContainer();
        this.createTable();
        this.options.initialize(this.options);
    }

    clearContainer() {
        this.options.container.innerHTML = '';
    }

    build() {
        this.clearContainer();
        this.createTable();
        this.options.initialize(this.options);
        return this;
    }
}
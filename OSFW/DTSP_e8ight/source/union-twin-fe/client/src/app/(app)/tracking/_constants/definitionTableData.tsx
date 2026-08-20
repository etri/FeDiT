export const INTERFACE_DEFINITION_COLUMNS = ['구분', 'Description'];

export const INTERFACE_DEFINITION_ROWS = [
  {
    rowId: 'purpose',
    cells: [
      '용도',
      '3세부 서비스 운영 (시각화 Process) 모듈은 트래킹(데이터/이벤트) 받고자 하는 정보를 요청 시 트래킹 명령을 구성하여 트래킹 모듈에 요청 전송',
    ],
  },
  {
    rowId: 'protocol',
    cells: ['프로토콜', 'HTTP Protocol 사용'],
  },
  {
    rowId: 'url',
    cells: ['URL', 'http://serviceIP:8002/fdt/detrck/rcv/tracking-commands'],
  },
  {
    rowId: 'method',
    cells: ['Method', 'POST'],
  },
  {
    rowId: 'content-type',
    cells: ['Content-Type', 'application/json'],
  },
];

export const TRACKING_REQUEST_COLUMNS = ['Name', 'Type', 'Description'];

export const TRACKING_REQUEST_ROWS = [
  {
    rowId: 'request-identifier',
    cells: [
      'requestIdtifier',
      'String',
      <ul
        key="description"
        className="text-foreground list-disc space-y-1 pl-5"
      >
        <li>트래킹 명령 요청 식별자</li>
        <li>트래킹 요청 시 단위 요청에 대한 식별자</li>
        <li>트래킹 이벤트 정보에 포함되어 전송</li>
      </ul>,
    ],
  },
  {
    rowId: 'callback-url',
    cells: [
      'callBackURL',
      'String',
      <ul key="description" className="text-foreground list-disc pl-5">
        <li>트래킹 이벤트 수신을 위한 응답 받을 URL</li>
      </ul>,
    ],
  },
  {
    rowId: 'tracking-process-info',
    cells: [
      'trckProcInfo[]',
      'JsonArray',
      <ul
        key="description"
        className="text-foreground list-disc space-y-1 pl-5"
      >
        <li>데이터 / 이벤트 트래킹 프로세스 정보</li>
        <li>
          트래킹 프로세스 타입, 데이터 트래킹 인터페이스 정보(Topic, Group)
          정보, 데이터 주기, 데이터 필터 타입 등
        </li>
        <li>
          이벤트 발생 타입 및 이벤트 발생/종료에 대한 정보 등의 요소로 구성
        </li>
      </ul>,
    ],
  },
];

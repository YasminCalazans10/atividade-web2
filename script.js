// Abyss Armada — Edição Épica (script.js)
// Added: simple AI (CPU) mode. CPU places ships randomly and attacks with basic hunt strategy.

// --- DOM references ---
const cinemaIntro = document.getElementById('cinema-intro');
const introContinue = document.getElementById('intro-continue');
const levelScreen = document.getElementById('level-screen');
const startScreen = document.getElementById('start-screen');
const placementScreen = document.getElementById('placement-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');
const levelEasyButton = document.getElementById('level-easy');
const levelMediumButton = document.getElementById('level-medium');
const levelHardButton = document.getElementById('level-hard');
const startGameButton = document.getElementById('start-game-button');
const quickModeButton = document.getElementById('quick-mode');
const vsCpuButton = document.getElementById('vs-cpu');
const restartGameButton = document.getElementById('restart-game-button');

const placementPlayerName = document.getElementById('placement-player-name');
const shipsToPlaceContainer = document.getElementById('ships-to-place');
const rotateShipButton = document.getElementById('rotate-ship-button');
const confirmPlacementButton = document.getElementById('confirm-placement-button');
const placementGrid = document.getElementById('placement-grid');

const player1Grid = document.getElementById('player1-grid');
const player2Grid = document.getElementById('player2-grid');
const currentPlayer1Display = document.getElementById('current-player1');
const currentPlayer2Display = document.getElementById('current-player2');
const turnBanner = document.getElementById('turn-banner');
const turnNameSpan = document.getElementById('turn-name');
const comboCountSpan = document.getElementById('combo-count');
const p1Info = document.getElementById('p1-info');
const p2Info = document.getElementById('p2-info');
const p1Fleet = document.getElementById('p1-fleet');
const p2Fleet = document.getElementById('p2-fleet');
const winnerDisplay = document.getElementById('winner-display');

// Audio
const audioInicio = document.getElementById('audio-inicio');
const audioBase = document.getElementById('audio-base');
const audioMarine = document.getElementById('audio-marine');
const audioTrovao = document.getElementById('audio-trovao');
const audioFlecha = document.getElementById('audio-flecha');
const audioExplode = document.getElementById('audio-explode');
const audioFuria = document.getElementById('audio-furia');
const audioGrito = document.getElementById('audio-grito');
const audioSplash = document.getElementById('audio-splash');

// Game state
let gameBoardSize = 10;
let selectedLevel = null;
let allShips = [];

// Configurações de níveis
const levelConfigs = {
  easy: {
    boardSize: 4,
    ships: [
      { id:'knarr', name:'Knarr', size:2, img:'navio1.png' },
      { id:'karve', name:'Karve', size:1, img:'navio2.png' }
    ]
  },
  medium: {
    boardSize: 6,
    ships: [
      { id:'longship', name:'Barco Longo', size:4, img:'navio1.png' },
      { id:'drakkar', name:'Drakkar', size:3, img:'navio2.png' },
      { id:'knarr', name:'Knarr', size:2, img:'navio1.png' },
      { id:'karve', name:'Karve', size:1, img:'navio2.png' }
    ]
  },
  hard: {
    boardSize: 12,
    ships: [
      { id:'longship', name:'Barco Longo', size:4, img:'navio1.png' },
      { id:'drakkar', name:'Drakkar', size:3, img:'navio2.png' },
      { id:'knarr', name:'Knarr', size:2, img:'navio1.png' },
      { id:'byrding', name:'Byrding', size:2, img:'navio2.png' },
      { id:'karve', name:'Karve', size:1, img:'navio2.png' },
      { id:'snekkja', name:'Snekkja', size:3, img:'navio1.png' }
    ]
  }
};

let player1 = { name:'Ragnar Lothbrok', ships:[], score:0, hits:0, combo:0 };
let player2 = { name:'Ivar, o Desossado', ships:[], score:0, hits:0, combo:0 };
let currentPlayer = null;
let placingPlayer = null;
let shipsToPlace = [];
let selectedShip = null;
let isHorizontal = true;
let quickMode = false;
let vsCPU = false;

// --- Simple AI state ---
let aiTargets = []; // remaining possible targets for AI
let aiPriority = []; // prioritized targets (neighbors after a hit)
let aiThinkingDelay = 600; // ms

// Utility: show screen
function showScreen(screen){
  [cinemaIntro,levelScreen,startScreen,placementScreen,gameScreen,endScreen].forEach(s=>s.classList.remove('active'));
  screen.classList.add('active');
}

// --- Intro flow ---
introContinue.addEventListener('click', ()=>{
  audioInicio.pause();
  if(audioBase) audioBase.volume = 0.4; // Ajustar volume para 0.4
  audioBase.play().catch(()=>{});
  setTimeout(()=>{ if(audioTrovao) audioTrovao.play().catch(()=>{}); }, 200);
  showScreen(levelScreen);
});

// --- Level selection ---
levelEasyButton.addEventListener('click', ()=>{ 
  selectedLevel = 'easy';
  applyLevelConfig('easy');
  showScreen(startScreen);
});

levelMediumButton.addEventListener('click', ()=>{ 
  selectedLevel = 'medium';
  applyLevelConfig('medium');
  showScreen(startScreen);
});

levelHardButton.addEventListener('click', ()=>{ 
  selectedLevel = 'hard';
  applyLevelConfig('hard');
  showScreen(startScreen);
});

function applyLevelConfig(level){
  const config = levelConfigs[level];
  gameBoardSize = config.boardSize;
  allShips = config.ships.map(s=>({...s}));
  
  // Ajustar tamanho das células baseado no tamanho do tabuleiro
  const cellSize = gameBoardSize <= 6 ? 50 : gameBoardSize <= 10 ? 40 : 35;
  document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
  document.documentElement.style.setProperty('--grid-size', gameBoardSize);
  
  // Aplicar CSS dinâmico aos grids
  const style = document.createElement('style');
  style.id = 'dynamic-grid-style';
  const existingStyle = document.getElementById('dynamic-grid-style');
  if(existingStyle) existingStyle.remove();
  
  style.textContent = `
    .grid {
      grid-template-columns: repeat(${gameBoardSize}, ${cellSize}px) !important;
      grid-auto-rows: ${cellSize}px !important;
    }
    .cell {
      width: ${cellSize}px !important;
      height: ${cellSize}px !important;
    }
  `;
  document.head.appendChild(style);
}

// Tocar som de introdução ao carregar ou quando a tela inicial aparecer
function playIntroSound(){
  if(audioInicio){
    audioInicio.currentTime = 66; // Começar a partir de 1:06 (66 segundos)
    audioInicio.play().catch(()=>{});
  }
}

// Tentar tocar quando a página carregar (após interação do usuário)
document.addEventListener('click', ()=>{
  playIntroSound();
},{ once:true });

// Start or quick mode
startGameButton.addEventListener('click', ()=>{ vsCPU=false; quickMode=false; startMatch(); });
quickModeButton.addEventListener('click', ()=>{ quickMode=true; vsCPU=false; startMatch(); });
vsCpuButton.addEventListener('click', ()=>{ vsCPU=true; quickMode=false; startMatch(); });

function startMatch(){
  player1.name = player1NameInput.value || 'Ragnar Lothbrok';
  player2.name = vsCPU ? 'Loki, o Traiçoeiro' : (player2NameInput.value || 'Ivar, o Desossado');
  
  // Criar novos arrays completamente independentes para cada jogador
  player1.ships = [];
  player2.ships = [];
  player1.score = 0;
  player2.score = 0;
  player1.combo = 0;
  player2.combo = 0;
  player1.hits = 0;
  player2.hits = 0;
  
  currentPlayer = player1;
  p1Info.textContent = `${player1.name} — ${player1.score} pts`;
  p2Info.textContent = `${player2.name} — ${player2.score} pts`;
  currentPlayer1Display.textContent = player1.name;
  currentPlayer2Display.textContent = player2.name;

  // Resetar posições usadas para novo jogo
  usedPositions.clear();

  // If quickMode (both random placements) -> auto place both and start battle immediately
  if(quickMode){
    // Garantir que cada jogador tenha navios completamente independentes
    placeShipsRandomly(player1);
    // Pequeno delay para garantir sequências diferentes
    setTimeout(() => {
      placeShipsRandomly(player2);
      setupBattle();
    }, 10);
    return;
  }

  // Start placement for player1; if vsCPU, auto-place CPU immediately and then show player1 placement
  if(vsCPU){
    placeShipsRandomly(player2);
    startPlacementPhase(player1);
  } else {
    startPlacementPhase(player1);
  }
}

// --- Placement phase ---
function startPlacementPhase(player){
  placingPlayer = player;
  shipsToPlace = allShips.map(s=>({...s}));
  selectedShip = null;
  isHorizontal = true;
  placementPlayerName.textContent = `Posicionamento — ${placingPlayer.name}`;
  confirmPlacementButton.disabled = true;
  createPlacementGrid();
  renderShipsToPlace();
  showScreen(placementScreen);
  audioMarine.play().catch(()=>{});
}

// create placement grid
function createPlacementGrid(){
  placementGrid.innerHTML='';
  for(let i=0;i<gameBoardSize*gameBoardSize;i++){
    const cell=document.createElement('div');
    cell.className='cell';
    cell.dataset.id=i;
    cell.addEventListener('mouseover', handleMouseOverPlacement);
    cell.addEventListener('mouseout', handleMouseOutPlacement);
    cell.addEventListener('click', handlePlaceShip);
    placementGrid.appendChild(cell);
  }
}

// render ships list
function renderShipsToPlace(){
  shipsToPlaceContainer.innerHTML='';
  if(shipsToPlace.length > 0){
    shipsToPlace.forEach(s=>{
      const el=document.createElement('div');
      el.className='ship-selector';
      el.textContent=`${s.name} (${s.size})`;
      el.dataset.shipId=s.id;
      el.addEventListener('click', ()=>{ selectShip(s); });
      shipsToPlaceContainer.appendChild(el);
    });
    selectShip(shipsToPlace[0]); // Seleciona o primeiro navio restante
    rotateShipButton.disabled = false; // Habilita o botão de rotação
  } else {
    shipsToPlaceContainer.textContent='Todos posicionados';
    confirmPlacementButton.disabled=false;
    selectedShip = null; // Nenhum navio selecionado
    rotateShipButton.disabled = true; // Desabilita o botão de rotação
  }
}

function selectShip(ship){
  selectedShip=ship;
  document.querySelectorAll('.ship-selector').forEach(e=>e.classList.remove('selected'));
  const el=document.querySelector(`.ship-selector[data-ship-id="${ship.id}"]`);
  if(el) el.classList.add('selected');
}

// placement helpers
function getShipPlacementCells(startCellId, shipSize, isHoriz){
  const cells=[];
  const r=Math.floor(startCellId/gameBoardSize);
  const c=startCellId%gameBoardSize;
  for(let i=0;i<shipSize;i++){
    const cc = isHoriz ? c+i : c;
    const rr = isHoriz ? r : r+i;
    if(cc>=gameBoardSize || rr>=gameBoardSize) return null;
    cells.push(rr*gameBoardSize+cc);
  }
  return cells;
}

function isValidPlacement(startCellId, shipSize, isHoriz, playerShips){
  const proposed = getShipPlacementCells(startCellId, shipSize, isHoriz);
  if(!proposed) return false;
  for(const ps of playerShips){
    for(const pc of proposed){
      if(ps.cells.includes(pc)) return false;
    }
  }
  return true;
}

function handleMouseOverPlacement(e){
  if(!selectedShip) return;
  const id=parseInt(e.target.dataset.id);
  const cells = getShipPlacementCells(id, selectedShip.size, isHorizontal);
  if(!cells) return;
  const valid = isValidPlacement(id, selectedShip.size, isHorizontal, placingPlayer.ships);
  cells.forEach(i=>{
    const ce=placementGrid.children[i];
    if(ce){ ce.classList.add(valid ? 'placement-preview' : 'invalid'); }
  });
}

function handleMouseOutPlacement(){
  Array.from(placementGrid.children).forEach(c=> c.classList.remove('placement-preview','invalid'));
}

function handlePlaceShip(e){
  if(!selectedShip){ alert('Selecione um navio.'); return; }
  const start = parseInt(e.target.dataset.id);
  const proposed = getShipPlacementCells(start, selectedShip.size, isHorizontal);
  if(!proposed || !isValidPlacement(start, selectedShip.size, isHorizontal, placingPlayer.ships)) { alert('Posição inválida.'); return; }
  // Criar uma cópia completa e independente do navio
  const newShip = {
    id: selectedShip.id,
    name: selectedShip.name,
    size: selectedShip.size,
    img: selectedShip.img,
    cells: [...proposed], // Cópia do array de células
    hits: [] // Array vazio independente
  };
  placingPlayer.ships.push(newShip);
  proposed.forEach(i=>{
    const c = placementGrid.children[i];
    c.classList.add('ship'); c.style.backgroundImage=`url('imagens/${selectedShip.img}')`;
  });
  shipsToPlace = shipsToPlace.filter(s=> s.id!==selectedShip.id);
  renderShipsToPlace();
  handleMouseOutPlacement();
  if(shipsToPlace.length===0){
    confirmPlacementButton.disabled=false;
  }
}

// rotate button
rotateShipButton.addEventListener('click', ()=>{ isHorizontal=!isHorizontal; })

// confirm placement
confirmPlacementButton.addEventListener('click', ()=>{
  if(placingPlayer===player1){
    // after player1 finishes, either show placement for player2 (human) or start battle if vsCPU
    if(vsCPU){
      setupBattle();
    } else {
      startPlacementPhase(player2);
    }
  } else {
    setupBattle();
  }
});

// --- Random placement for AI or Quick Mode ---
// Armazenar posições já usadas para evitar repetição entre jogadores
let usedPositions = new Set();
let randomCallCounter = 0;

// Função auxiliar para gerar número aleatório único baseado no jogador
function getUniqueRandom(player, max){
  randomCallCounter++;
  const playerId = player === player1 ? 123456 : 789012;
  const timestamp = Date.now();
  const randomSeed = Math.random() * 1000000;
  // Combinar múltiplos fatores para garantir unicidade: playerId, timestamp, randomSeed e contador
  const uniqueValue = (playerId * 10000 + timestamp % 100000 + randomSeed + randomCallCounter * 1000) % 1000000;
  return Math.floor((uniqueValue / 1000000) * max);
}

function placeShipsRandomly(player){
  player.ships = [];
  const triesLimit = 2000;
  
  // Resetar contador para cada jogador
  randomCallCounter = 0;
  
  // Criar um conjunto de posições usadas para este jogador
  const playerUsedCells = new Set();
  
  // Adicionar um pequeno delay baseado no jogador para garantir sequências diferentes
  const playerOffset = player === player1 ? 0 : 100;
  
  for(const ship of allShips){
    let placed=false;
    let tries=0;
    while(!placed && tries<triesLimit){
      tries++;
      
      // Usar múltiplas chamadas de Math.random() para garantir aleatoriedade
      // Combinar com offset do jogador para garantir diferença
      const random1 = Math.random();
      const random2 = Math.random();
      const random3 = Math.random();
      
      // Combinar múltiplos valores aleatórios com offset do jogador
      const combinedRandom = (random1 * 1000 + random2 * 100 + random3 * 10 + playerOffset + tries) % 1;
      
      const orientation = combinedRandom < 0.5;
      const start = Math.floor(combinedRandom * (gameBoardSize * gameBoardSize));
      const cells = getShipPlacementCells(start, ship.size, orientation);
      
      if(!cells) continue;
      
      // Verificar se alguma célula já foi usada por este jogador
      let overlap=false;
      for(const c of cells){
        if(playerUsedCells.has(c)){
          overlap=true;
          break;
        }
      }
      if(overlap) continue;
      
      // Verificar overlap com navios já posicionados
      for(const s of player.ships){
        for(const c of cells) {
          if(s.cells.includes(c)) { 
            overlap=true; 
            break; 
          }
        }
        if(overlap) break;
      }
      if(overlap) continue;
      
      // Adicionar células às usadas e posicionar o navio
      cells.forEach(c => playerUsedCells.add(c));
      // Criar uma cópia completa e independente do navio
      const newShip = {
        id: ship.id,
        name: ship.name,
        size: ship.size,
        img: ship.img,
        cells: [...cells], // Cópia do array de células
        hits: [] // Array vazio independente
      };
      player.ships.push(newShip);
      placed=true;
    }
    if(!placed) console.warn('Falha ao posicionar um navio depois de muitas tentativas.');
  }
  
  // Adicionar posições deste jogador ao conjunto global
  playerUsedCells.forEach(cell => usedPositions.add(cell));
}

// --- Battle setup ---
function setupBattle(){
  createBoards();
  updateFleetIcons();
  updateTurnDisplay();
  showScreen(gameScreen);
  audioMarine.pause();
  audioTrovao.play().catch(()=>{});

  // prepare AI targets list if vsCPU
  if(vsCPU){
    aiTargets = [];
    for(let i=0;i<gameBoardSize*gameBoardSize;i++) aiTargets.push(i);
    shuffleArray(aiTargets);
    aiPriority = [];
    // If CPU starts, schedule its turn
    if(currentPlayer === player2){
      scheduleAITurn();
    }
  }
}

// create two boards for battle
function createBoards(){
  player1Grid.innerHTML=''; player2Grid.innerHTML='';
  for(let i=0;i<gameBoardSize*gameBoardSize;i++){
    const c1=document.createElement('div'); c1.className='cell fog'; c1.dataset.id=i; player1Grid.appendChild(c1);
    const c2=document.createElement('div'); c2.className='cell fog'; c2.dataset.id=i; player2Grid.appendChild(c2);
  }
  // attach listeners on opponent boards so currentPlayer attacks opponent
  player1Grid.addEventListener('click', (e)=>{ if(e.target.classList.contains('cell')) handleAttack(e.target); });
  player2Grid.addEventListener('click', (e)=>{ if(e.target.classList.contains('cell')) handleAttack(e.target); });
  currentPlayer = player1;
}

// helper to find target/who is attacked based on clicked cell parent
function getTargetAndGrid(cell){
  const parent = cell.parentElement;
  // Se clicamos no player1Grid, estamos vendo/atacando o tabuleiro do player1
  // Se clicamos no player2Grid, estamos vendo/atacando o tabuleiro do player2
  if(parent===player1Grid) return { target: player1, grid: player1Grid };
  return { target: player2, grid: player2Grid };
}

// handle attack
function handleAttack(cell){
  // Determinar qual jogador está sendo atacado baseado no grid clicado
  const { target, grid } = getTargetAndGrid(cell);
  const opponent = (currentPlayer===player1) ? player2 : player1;
  
  // Verificar se estamos atacando o oponente correto
  // currentPlayer deve atacar o opponent, então target deve ser opponent
  if(target !== opponent) {
    // Não permitir atacar seu próprio tabuleiro
    return;
  }
  
  if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
  
  // Garantir que a célula clicada está no grid correto
  const clickedGrid = cell.parentElement;
  if(clickedGrid !== grid) return;

  const id = parseInt(cell.dataset.id);
  let hit=false; let hitShip=null;
  
  // Garantir que estamos verificando apenas os navios do oponente correto
  // Criar uma cópia do array de navios para evitar problemas de referência
  const opponentShips = opponent.ships;
  
  // Encontrar o navio específico que foi acertado nesta célula
  for(let i = 0; i < opponentShips.length; i++){
    const s = opponentShips[i];
    // Verificar se esta célula pertence a este navio e ainda não foi acertada
    if(s && s.cells && Array.isArray(s.cells) && s.cells.includes(id)){
      if(!s.hits) s.hits = [];
      if(!s.hits.includes(id)){
        hit=true;
        hitShip=s;
        // Adicionar o hit ao array de hits do navio
        s.hits.push(id);
        break; // Parar assim que encontrar o navio correto
      }
    }
  }

  if(hit && hitShip){
    // Já verificamos que a célula pertence ao navio e não foi acertada no loop acima
    cell.classList.remove('fog');
    
    // Armazenar a imagem do navio acertado para garantir que seja a correta
    // Usar uma cópia da referência para evitar problemas
    const shipImage = hitShip.img || 'navio1.png';
    
    // Primeiro: mostrar a imagem do barco APENAS nesta célula específica
    cell.classList.add('ship');
    cell.style.backgroundImage = `url('imagens/${shipImage}')`;
    cell.style.backgroundSize = 'contain';
    cell.style.backgroundRepeat = 'no-repeat';
    cell.style.backgroundPosition = 'center';
    
    // Segundo: animar a flecha
    playHitEffects(cell, hitShip);
    
    // Terceiro: após a flecha atingir, substituir pela explosão
    setTimeout(() => {
      // Verificar se a célula ainda existe e não foi modificada
      // E garantir que estamos modificando apenas a célula correta
      if(cell && cell.classList.contains('ship') && cell.dataset.id === id.toString()){
        cell.classList.remove('ship');
        cell.classList.add('hit');
        cell.style.backgroundImage = "url('imagens/explosao.png')";
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundRepeat = 'no-repeat';
        cell.style.backgroundPosition = 'center';
      }
    }, 600); // Tempo para a flecha atingir
    
    // Atualizar pontuação apenas para o jogador que está atacando
    const scoreBonus = currentPlayer.combo >= 2 ? 1 : 0;
    currentPlayer.score += 1 + scoreBonus;
    currentPlayer.combo += 1;
    comboCountSpan.textContent = currentPlayer.combo;
    if(currentPlayer.combo===2) audioFuria.play().catch(()=>{});
    audioGrito.play().catch(()=>{});

    // sunk?
    // Verificar se todas as células do navio foram acertadas
    const allCellsHit = hitShip.cells.every(c => hitShip.hits.includes(c));
    if(allCellsHit){
      setTimeout(() => {
        // Usar o grid correto (onde o navio está sendo atacado)
        // Apenas atualizar as células deste navio específico
        hitShip.cells.forEach(ci=>{
          const cellEl = grid.children[ci];
          if(cellEl && !cellEl.classList.contains('hit')){
            cellEl.classList.remove('fog', 'ship'); 
            cellEl.classList.add('hit'); 
            cellEl.style.backgroundImage=`url('imagens/explosao.png')`;
            cellEl.style.backgroundSize = 'cover';
            cellEl.style.backgroundRepeat = 'no-repeat';
            cellEl.style.backgroundPosition = 'center';
          }
        });
        // Adicionar bônus de afundamento apenas uma vez
        currentPlayer.score += 2;
        shakeScreen();
      }, 650);
    }
    // check win condition
    const allSunk = opponent.ships.every(s=> s.cells.every(c=> s.hits.includes(c)));
    updateHud();
    if(allSunk){ 
      setTimeout(() => {
        endGame(currentPlayer);
      }, 700);
      return; 
    }
  } else {
    cell.classList.remove('fog'); cell.classList.add('miss');
    playMissEffects(cell);
    audioSplash.currentTime = 0; audioSplash.play().catch(()=>{});
    currentPlayer.combo = 0;
    comboCountSpan.textContent = 0;
  }

  // if AI attacked, manage its internal memory (if vsCPU and currentPlayer==player2)
  if(vsCPU && currentPlayer===player2){
    // remove chosen target from aiTargets if present
    const idx = aiTargets.indexOf(id);
    if(idx!==-1) aiTargets.splice(idx,1);
    if(hit){
      // add neighbors to priority queue
      addNeighborsToPriority(id);
    }
  }

  // switch turn with delay for drama (human + AI scheduling handled after)
  setTimeout(()=>{ switchPlayerTurn(); }, 700);
}

// AI helpers
function scheduleAITurn(){
  if(!vsCPU) return;
  setTimeout(()=>{ if(currentPlayer===player2) aiTakeTurn(); }, aiThinkingDelay);
}

function aiTakeTurn(){
  if(!vsCPU || currentPlayer!==player2) return;
  // select from priority first, else from aiTargets
  let targetIndex = null;
  while(aiPriority.length>0){
    const cand = aiPriority.shift();
    // skip if already tried (check the cell class on opponent grid)
    const el = player1Grid.children[cand];
    if(!el) continue;
    if(el.classList.contains('hit') || el.classList.contains('miss')) continue;
    targetIndex = cand; break;
  }
  if(targetIndex===null){
    // pop from aiTargets until valid
    while(aiTargets.length>0){
      const cand = aiTargets.shift();
      const el = player1Grid.children[cand];
      if(!el) continue;
      if(el.classList.contains('hit') || el.classList.contains('miss')) continue;
      targetIndex = cand; break;
    }
  }
  if(targetIndex===null) return; // nothing left

  // make sure AI is the current player
  currentPlayer = player2;
  updateTurnDisplay();

  const cellEl = player1Grid.children[targetIndex];
  if(cellEl) handleAttack(cellEl);

  // schedule next actions: after switching back to player2 later, schedule again
  setTimeout(()=>{
    if(currentPlayer===player2) scheduleAITurn();
  }, 900);
}

function addNeighborsToPriority(index){
  const r = Math.floor(index/gameBoardSize);
  const c = index%gameBoardSize;
  const deltas = [[1,0],[-1,0],[0,1],[0,-1]];
  deltas.forEach(d=>{
    const nr=r+d[0], nc=c+d[1];
    if(nr>=0 && nr<gameBoardSize && nc>=0 && nc<gameBoardSize){
      const ni = nr*gameBoardSize+nc;
      // push if not already present
      if(!aiPriority.includes(ni) && aiTargets.includes(ni)){
        aiPriority.push(ni);
      }
    }
  });
}

// shuffle util
function shuffleArray(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function playHitEffects(cell, ship){
  const rect = cell.getBoundingClientRect();
  
  // Criar a animação da flecha
  const arrow = document.createElement('div');
  arrow.style.position = 'fixed';
  arrow.style.width = '60px';
  arrow.style.height = '60px';
  arrow.style.backgroundImage = "url('imagens/flecha.png')";
  arrow.style.backgroundSize = 'contain';
  arrow.style.backgroundRepeat = 'no-repeat';
  arrow.style.backgroundPosition = 'center';
  arrow.style.zIndex = '9999';
  arrow.style.pointerEvents = 'none';
  arrow.style.filter = 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.8))';
  
  // Posição inicial (topo da tela, centro horizontal)
  const startX = window.innerWidth / 2 - 30;
  const startY = -60;
  arrow.style.left = startX + 'px';
  arrow.style.top = startY + 'px';
  arrow.style.transform = 'rotate(45deg) scale(1)';
  arrow.style.transition = 'all 0.6s ease-in';
  arrow.style.opacity = '1';
  
  document.body.appendChild(arrow);
  
  // Forcar reflow
  arrow.offsetHeight;
  
  // Animar a flecha para o quadrado
  arrow.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  arrow.style.top = (rect.top + rect.height / 2 - 30) + 'px';
  arrow.style.opacity = '0.8';
  
  // Remover a flecha após a animação
  setTimeout(() => {
    arrow.style.opacity = '0';
    arrow.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => arrow.remove(), 200);
  }, 600);
  
  // Som da flecha
  audioFlecha.currentTime = 0;
  audioFlecha.play().catch(() => {});
  
  // Som da explosão (quando a flecha atingir)
  setTimeout(() => {
    audioExplode.currentTime = 0;
    audioExplode.play().catch(() => {});
  }, 600);
}

// Função para animar a seta em ataques que erram
function playMissEffects(cell){
  console.log("playMissEffects chamado, tentando tocar audioSplash"); // Log para debug
  const rect = cell.getBoundingClientRect();
  
  // Criar a animação da flecha
  const arrow = document.createElement('div');
  arrow.style.position = 'fixed';
  arrow.style.width = '60px';
  arrow.style.height = '60px';
  arrow.style.backgroundImage = "url('imagens/flecha.png')";
  arrow.style.backgroundSize = 'contain';
  arrow.style.backgroundRepeat = 'no-repeat';
  arrow.style.backgroundPosition = 'center';
  arrow.style.zIndex = '9999';
  arrow.style.pointerEvents = 'none';
  arrow.style.filter = 'drop-shadow(0 0 8px rgba(100, 150, 200, 0.6))';
  
  // Posição inicial (topo da tela, centro horizontal)
  const startX = window.innerWidth / 2 - 30;
  const startY = -60;
  arrow.style.left = startX + 'px';
  arrow.style.top = startY + 'px';
  arrow.style.transform = 'rotate(45deg) scale(1)';
  arrow.style.transition = 'all 0.6s ease-in';
  arrow.style.opacity = '1';
  
  document.body.appendChild(arrow);
  
  // Forcar reflow
  arrow.offsetHeight;
  
  // Animar a flecha para o quadrado
  arrow.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  arrow.style.top = (rect.top + rect.height / 2 - 30) + 'px';
  arrow.style.opacity = '0.6';
  
  // Remover a flecha após a animação
  setTimeout(() => {
    arrow.style.opacity = '0';
    arrow.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => arrow.remove(), 200);
  }, 600);
  
  // Som da flecha
  if(audioFlecha) audioFlecha.currentTime = 0; 
  if(audioFlecha) audioFlecha.play().catch(() => {});
  
  // Som da onda (splash)
  if(audioSplash) audioSplash.volume = 0.8;
  setTimeout(() => {
    if(audioSplash) audioSplash.currentTime = 0;
    if(audioSplash) audioSplash.play().catch(()=>{});
  }, 50); // Pequeno delay para evitar conflitos
}

function shakeScreen(){
  document.body.animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}], { duration:300, iterations:1 });
}

function switchPlayerTurn(){
  currentPlayer = (currentPlayer===player1) ? player2 : player1;
  updateTurnDisplay();
  // if AI's turn, schedule AI
  if(vsCPU && currentPlayer===player2){
    scheduleAITurn();
  }
}

// update HUD
function updateTurnDisplay(){
  turnNameSpan.textContent = currentPlayer.name;
  turnBanner.classList.add('pulse');
  setTimeout(()=> turnBanner.classList.remove('pulse'),600);
  updateHud();
}

function updateHud(){
  p1Info.textContent = `${player1.name} — ${player1.score} pts`; p2Info.textContent = `${player2.name} — ${player2.score} pts`;
  updateFleetIcons();
}

function updateFleetIcons(){
  // Verificar se os elementos existem antes de atualizar
  if(p1Fleet && p2Fleet){
    p1Fleet.innerHTML = ''; p2Fleet.innerHTML='';
    player1.ships.forEach(s=>{ const ic=document.createElement('div'); ic.className='fleet-icon'; ic.title=s.name; ic.textContent='⛵'; p1Fleet.appendChild(ic); });
    player2.ships.forEach(s=>{ const ic=document.createElement('div'); ic.className='fleet-icon'; ic.title=s.name; ic.textContent='⛵'; p2Fleet.appendChild(ic); });
  }
}

// check win
function endGame(winner){
  winnerDisplay.textContent = `${winner.name} conquistou os mares gelados!`;
  audioTrovao.play().catch(()=>{});
  audioFuria.play().catch(()=>{});
  showScreen(endScreen);
}

// restart
restartGameButton.addEventListener('click', ()=>{
  location.reload();
});

// --- initial show ---
showScreen(cinemaIntro);
// Tentar tocar o som da tela inicial
setTimeout(() => {
  playIntroSound();
}, 100);

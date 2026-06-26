# Como usar este projeto na Bambu Studio (passo a passo)

## 1) Onde está o projeto

Arquivo do modelo (fonte CAD):
- `cad/vanguard-rx-topclip/vanguard_rx_topclip.scad`

Esse arquivo `.scad` precisa ser convertido para `.stl` antes de abrir na Bambu Studio.

## 2) Instalar OpenSCAD (Mac)

Opcao A (mais simples):
1. Abra https://openscad.org/downloads.html
2. Baixe a versao para macOS.
3. Instale e abra o OpenSCAD.

Opcao B (terminal com Homebrew):
1. `brew install --cask openscad`

## 3) Abrir o projeto e ajustar medidas

1. No OpenSCAD, clique em File > Open.
2. Selecione `cad/vanguard-rx-topclip/vanguard_rx_topclip.scad`.
3. Os parametros principais ficam no topo do arquivo (secao A):
   - `half_total_width = 27.5` (equivale a 55 mm total)
   - `retention_mode = "slot"` (encaixe superior)
   - `slot_depth = 2.1` (para lente de 2.0 mm com folga)
   - `slot_height = 2.2`

## 4) Gerar STL

No OpenSCAD (interface):
1. Aperte F6 (Render completo).
2. File > Export > Export as STL.
3. Salve como `vanguard_rx_topclip.stl`.

Via terminal (se OpenSCAD instalado):
1. Rode na raiz do repo:
   `openscad -o cad/vanguard-rx-topclip/vanguard_rx_topclip.stl cad/vanguard-rx-topclip/vanguard_rx_topclip.scad`

## 5) Abrir STL na Bambu Studio

1. Abra Bambu Studio.
2. Clique em New Project.
3. Arraste o arquivo `vanguard_rx_topclip.stl` para a mesa.
4. Quando perguntar sobre unidade, use millimeters (mm).

## 6) Configuracao recomendada de impressao (inicio)

- Material: PETG
- Layer height: 0.16 mm
- Walls: 4
- Infill: 35% (Gyroid)
- Top/Bottom layers: 5
- Brim: 5 mm
- Suportes: desativado (normalmente nao precisa)
- Orientacao: plano, como importado

## 7) Envio para impressora Bambu

1. Clique em Slice Plate.
2. Revise o preview de camadas.
3. Clique em Print Plate (ou Export G-code se preferir).
4. Escolha sua impressora Bambu e envie.

## 8) Ajuste fino do encaixe (muito importante)

Se encaixe ficou apertado:
- reduza `slot_depth` para 2.0
- aumente `slot_height` para 2.3

Se encaixe ficou folgado:
- aumente `slot_depth` para 2.2
- reduza `slot_height` para 2.1

## 9) Modo colagem em vez de encaixe

Se quiser usar colagem da lente no topo:
1. Mude `retention_mode = "glue"`.
2. Exporte STL de novo.
3. Imprima e use adesivo apropriado para lente + plastico (testar em amostra antes).

## 10) Observacao importante

Este modelo e um prototipo parametrico inspirado no formato top-only solicitado.
Como cada armacao/lente varia, e esperado fazer 1-3 iteracoes de ajuste para ficar perfeito.

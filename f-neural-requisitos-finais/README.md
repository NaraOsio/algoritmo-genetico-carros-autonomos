# f-neural

Simulador top-down em Canvas 2D com carros, sensores, rede neural e algoritmo genético.

## Como rodar

Abra `index.html` no navegador ou use Live Server no VS Code.

## Controles

- W: acelerar
- S: frear
- A/D: virar
- Espaço: freio de mão
- Scroll: zoom
- Arrastar mouse: mover câmera

## Modos

- Manual
- Treinar
- Corrida

## Visual

- Fundo verde gramado
- Asfalto cinza `#9B9B9B`
- Bordas brancas
- Obstáculos pretos com centro laranja
- Carros coloridos
- Sensores translúcidos


## Atualização de IA para pistas sinuosas

Esta versão melhora o aprendizado em curvas técnicas:

- velocidade máxima menor;
- rede neural maior;
- sensores mais focados;
- mais checkpoints;
- fitness com alinhamento;
- penalidade para zig-zag;
- IA capaz de frear.


## Ajustes para melhorar curvas técnicas

- Velocidade máxima reduzida para 2.7.
- Sensores frontais reduzidos para 110 graus.
- Checkpoints aumentados para melhorar aprendizado em curvas.
- Penalidade maior para zig-zag.
- Penalidade para andar colado na borda.
- Recompensa maior por alinhamento com a pista.


## Correção importante

Se você atualizou a rede neural, clique em **Reset GA** antes de treinar novamente.
Isso remove populações antigas salvas no localStorage que podem ficar incompatíveis.

No modo **Treinar**, os carros andam sozinhos porque são controlados pela IA.
No modo **Manual**, o carro só anda quando você pressiona `W`.


## Refino: sobreviver → dirigir bem

Nesta versão a IA não é recompensada apenas por sobreviver.
Ela recebe mais pontos por avançar checkpoints novos, andar alinhada, ficar mais centralizada e dirigir com suavidade.

Também recebe punições por:
- repetir checkpoints;
- ficar sem progresso real;
- andar colada na borda;
- fazer zig-zag;
- dirigir desalinhada.


## Ajuste final de requisitos

Esta versão equilibra melhor segurança e desempenho:

- velocidade máxima aumentada para 3.0;
- recompensa maior para velocidade alinhada;
- punição de borda reduzida para permitir tangência;
- progresso real por checkpoint mais valorizado;
- carros têm mais tempo para completar pistas técnicas;
- rotação entre pistas aumentada para 35 gerações;
- salvamento da população treinada confirmado por alerta.

Fluxo recomendado:

1. Clique em Reset GA.
2. Vá em Treinar.
3. Use Turbo.
4. Treine por 100 a 300 gerações.
5. Clique em Salvar.
6. Vá em Corrida.
7. Escolha qualquer uma das 3 pistas.

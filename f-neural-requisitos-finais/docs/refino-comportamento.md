# Refino de comportamento da IA

Esta versão tenta mudar a IA da fase "sobreviver" para "dirigir bem".

Ajustes:

- Fitness prioriza progresso real por checkpoints novos.
- Penaliza repetição de checkpoints.
- Penaliza ficar muito tempo sem novo checkpoint.
- Penaliza andar colado na borda.
- Penaliza zig-zag forte.
- Recompensa centralidade na pista.
- Recompensa alinhamento com a direção da pista.
- Recompensa velocidade somente quando alinhada e centralizada.
- Rotação entre pistas aumentada para 25 gerações.
- Mutação reduzida para 2.5% para estabilizar indivíduos bons.

# All data comes from the survivoR package
library(survivoR)

data("castaway_details")
data("castaways")
data("confessionals")

write.csv(castaway_details,
          file = "data/raw/castaway_details.csv",
          row.names = FALSE)
write.csv(castaways,
          file = "data/raw/castaways.csv",
          row.names = FALSE)
write.csv(confessionals,
          file = "data/raw/confessionals.csv",
          row.names = FALSE)
CREATE TABLE user (
    id INT NOT NULL UNIQUE PRIMARY KEY AUTO_INCREMENT,
    tid INT NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    storageMessageId INT NOT NULL
)

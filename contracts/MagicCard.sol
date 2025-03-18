// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ERC721.sol";

contract MagicCard is ERC721 {
    
    address owner; //владелец
    
    //типы, описывающие токен
    enum  Elements {Jocker, Fire, Air, Water, Earth}         
    
    struct TokenDescription {
        uint tokenId;
        Elements element;
        uint rep;
        string tokenURI;       
    }

    //Эмиссия
    uint[5] public supply = [1, 111, 222, 333, 444]; //задаем значения максимального сапплая
    uint[5] _baseRep = [1000, 100, 75, 50, 25]; //задаем базовые значения репы      
    
    uint [5] public currentSupply; // текущая эмиссия NFT каждого типа
    uint counterNFT; // счетчик выпущенных NFT

    //Storage
    TokenDescription [] _tokenStorage;    

    //Цены WEY
    uint public constant MINT_PRICE = 1000000; 
    uint public constant REP_PRICE = 200;

    //Модификаторы
    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner");
        _;        
    }
    //события
    event ReputationIncrease(address indexed to, uint indexed tokenID, string message);
    
    constructor(string memory name, string memory symbol) {        
        owner = msg.sender; 
        //_preMint();
    }

    //функции для владельца
    function withdraw(address payable recipient) external onlyOwner() {
        uint minimumBalance; //сделaть функцию для расчета
        uint amount = address(this).balance - minimumBalance;        
        recipient.transfer(amount);
    }

    function setTaskRep(uint tokenId, uint repReward, string memory message) external onlyOwner {
        
        _tokenStorage[tokenId].rep += repReward;
        address recipient = _owners[tokenId];
        emit ReputationIncrease(recipient, tokenId, message);
    }

    //функции для статистики и отображения

    function tokenURI(uint tokenId) public view override _requireMinted(tokenId) returns (string memory) {
        string memory _tokenURI = _tokenStorage[tokenId].tokenURI;
        string memory _base = _baseURI();

        if(bytes(_base).length == 0){
            return _tokenURI;
        }
        if(bytes(_base).length > 0){
            return string(abi.encodePacked(_base, _tokenURI));
        }

        super.tokenURI(tokenId);
    }
    
    function getDescription(uint tokenId) public returns(TokenDescription memory) {
        
        TokenDescription memory token = TokenDescription({tokenId: _tokenStorage[tokenId].tokenId,
                                                          element: _tokenStorage[tokenId].element, 
                                                          rep: _tokenStorage[tokenId].rep,
                                                          tokenURI: _tokenStorage[tokenId].tokenURI});
        return token;
    }

    function isMintable() external view returns(bool) {
        return (counterNFT < _maxTotalSupply());
    }

    /*function userNFTs(address user) public view returns(TokenDescription[] memory){
        //uint countNFT = _balances[user];
        TokenDescription[] memory userNFTs;
        uint i;
        for(uint counter = 0; counter != counterNFT; ++counter){
            if(_owners[counter] == user){
                userNFTs.push(new TokenDescription(getDescription(counter)));
                //userNFTs.push(_tokenStorage[counter]);
                //userNFTs[i] = getDescription(counter);
                //i++;
            }
        }
        return userNFTs; 
    }*/
    
    //функции для пользователя
    function mint() external payable {
        
        require(msg.value < MINT_PRICE, "not enough money");
        
        uint dropAmount = MINT_PRICE / 3;        
        _distributeAll(dropAmount);
               
        uint tokenId = counterNFT;
        counterNFT++;
        TokenDescription memory token = _createNewNFT(tokenId, msg.sender);
        _tokenStorage.push(token);
        super._safeMint(msg.sender, tokenId);                
    }

    function buyNFT(uint tokenId) external payable {
        
        uint price = MINT_PRICE + _tokenStorage[tokenId].rep * REP_PRICE;
        require(msg.value < price, "not enough money");        
        
        uint dropAmount = price / 3;
        _distributeAll(dropAmount);       
        _repIncrease(tokenId);
        super._safeTransfer(address(this), msg.sender, tokenId);
               
    }
    
    function sellNFT(uint tokenId) external {
        
        uint price = MINT_PRICE + _tokenStorage[tokenId].rep * REP_PRICE - (MINT_PRICE / 5); //20% дисконта к цене минта, но покупаем всю репу
        sellNFT(tokenId, price);                
    }

    function sellNFT(uint tokenId, uint price) public {
        
        address payable seller = payable (msg.sender);
        
        super.safeTransferFrom(seller, address(this), tokenId);
        //переводим деньги
        seller.transfer(price);
    }

    function burn(uint tokenId) public override {

        bytes calldata message;
        super.safeTransferFrom(msg.sender, address(this), tokenId);

    }

    //служебные функции      
    
    function _preMint() public {
        //первоначальная эмиссия
        //минтим на баланс контракта 1 джокера и по 10% каждого типа NFT
        address self = address(this);
        //Джокер
        currentSupply[uint(Elements.Jocker)]++;        
        _tokenStorage[counterNFT] = _createNewNFT(0,Elements.Jocker);
        _mint(self, counterNFT);
        ++counterNFT;        
        //Остальные
        for(uint i = 1; i <= 4; ++i){
            Elements element = Elements(i);
            uint count = supply[uint(element)] / 10;
            for(uint j = 0; j != count; ++j){
                currentSupply[uint(element)]++;
                _tokenStorage[counterNFT] = _createNewNFT(counterNFT, element);
                _mint(self, counterNFT);
                ++counterNFT;
            }
        }
    }        

    function _maxTotalSupply() internal view returns (uint) {
        uint maxSupply;
        for (uint counter = 0; counter != supply.length; ++counter) {
            maxSupply += supply[counter];
        }
        return maxSupply;
    }

    function _calculateRandomElement(uint tokenId, address recipient) internal view returns(Elements) {
        
        uint[5] memory limits;                
        for(uint counter = 1; counter != 5; ++counter) {
            limits[counter] = supply[counter] - currentSupply[counter];
        }         
        
        uint random = uint(keccak256(abi.encodePacked(block.timestamp, recipient, tokenId))) % tokenId;        
        Elements element = Elements.Earth;

        for(uint counter = 1; counter != 5; ++counter) {
            if(random <= (limits[counter - 1] + limits[counter])) {
                element = Elements(counter);
                counter = 5;
            }
        }
        return element;       
    }

    function _repIncrease(uint tokenId) internal {
        
        uint repInc =  _baseRep[uint(_tokenStorage[tokenId].element)] / 10; //за каждую простую операцию добавляем 10% базовой репы
        _tokenStorage[tokenId].rep += repInc;
        _tokenStorage[0].rep += repInc; //Джокер всегда получает премию
    }

    function _totalRepCalc() internal view returns(uint) {
        
        uint totalRep;
        for(uint counter = 0; counter != counterNFT; ++counter){
            totalRep += _tokenStorage[counter].rep;
        }
        return totalRep;
    }       
        
    function _createNewNFT(uint tokenId, Elements element) internal view returns (TokenDescription memory){
        
        TokenDescription memory token = TokenDescription({tokenId: tokenId,
                                                   element: element, 
                                                   rep: _baseRep[uint(element)],
                                                   tokenURI: ""});
        return token;
    }  
     
    
    function _createNewNFT(uint tokenId, address recipient) internal view returns (TokenDescription memory){
        
        Elements element = _calculateRandomElement(tokenId, recipient);

        return _createNewNFT(tokenId, element);

    }    
    
    function _distributeAll(uint dropAmount) internal {

        uint totalRep = _totalRepCalc();
        uint dropOnRep = dropAmount / totalRep;
        
        for(uint counter = 0; counter != counterNFT; ++counter) {
            if(_owners[counter] != address(this)) {
                uint drop = dropOnRep * _tokenStorage[counter].rep;
                address payable recipient = payable(_owners[counter]);
                recipient.transfer(drop);
            }
        }               
    }           
}
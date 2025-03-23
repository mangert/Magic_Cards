// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22; 

import "./ERC721.sol";
import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "hardhat/console.sol";

contract MagicCard is ERC721, ERC165{
    
    address owner; //владелец
    
    //Описание токена и хранилище
    enum  Elements {Jocker, Fire, Air, Aqua, Earth}
    string [5] elementsName = ["Jocker", "Fire", "Air", "Aqua", "Earth"];         

    mapping(uint => uint) tokenRep;
    mapping(uint => Elements) tokenType;
    
    //заготовка под оптимизацию
    /*struct TokenDesc {
        uint tokenId;
        Elements element;
        uint rep;        
    }
    //Storage
    mapping(address => mapping(uint => TokenDesc) tokenStorage);
    */

    //Эмиссия
    uint[5] public supply = [1, 111, 222, 333, 444]; //задаем значения максимального сапплая
    uint[5] _baseRep = [1000, 100, 75, 50, 25]; //задаем базовые значения репы      
    
    uint [5] public currentSupply; // текущая эмиссия NFT каждого типа
    uint counterNFT; // счетчик выпущенных NFT
    bool preMintFlag = false;
    
    //Цены wey
    uint public mintPrice = 100000000000000000; 
    uint public repPrice = 200000000000000;

    //Модификаторы
    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner");
        _;        
    }
    //события
    event ReputationIncrease(address indexed to, uint indexed tokenID, string message);
    
    constructor() {        
        name = "MagicNFT";
        symbol = "MEL";
        owner = msg.sender;         
    }

    //функции для владельца
    function withdrawAll(address payable recipient) external onlyOwner() {
        uint minimumBalance =_calcMinimumBalance(); //сделaть функцию для расчета
        uint amount = address(this).balance - minimumBalance;        
        recipient.transfer(amount);
    }

    function withdraw(uint amount, address payable recipient) external onlyOwner() {
        uint minimumBalance = _calcMinimumBalance(); 
        uint maxAmount = address(this).balance - minimumBalance;        
        require(amount <= maxAmount, "too much sum");
        recipient.transfer(amount);
    }

    function _calcMinimumBalance() public view onlyOwner() returns (uint) {

        uint totalUserPrice;
        uint usersNFTCount;
        for(uint counter = 0; counter != counterNFT; ++counter){
            if(ownerOf(counter) != address(this)) {
                totalUserPrice += getSellPrice(counter);
                ++usersNFTCount;
            }
        }
        uint estimatedGasCosts = 1657252749 * 30000000;
        totalUserPrice += estimatedGasCosts;
        return totalUserPrice;
    }

    function setTaskRep(uint tokenId, uint repReward, string memory message) external onlyOwner {
        
        tokenRep[tokenId] += repReward;
        address recipient = _owners[tokenId];
        emit ReputationIncrease(recipient, tokenId, message);
    }

    function getBalance() external view returns(uint) {
        return address(this).balance;
    }

    //функции для статистики и отображения

    //геттеры для мэппингов и полей
    function getUserBalance(address user) external view returns(uint) {
        return _balances[user];
    }
    function getCountNFT() external view returns(uint) {
        return counterNFT;
    }

    function getMintPrice() public view returns(uint) {
        return mintPrice;

    }
    function getBuyPrice(uint tokenId) public view returns(uint) {
        return mintPrice + tokenRep[tokenId] * repPrice;
        
    }

    function getSellPrice(uint tokenId) public view returns(uint) {
        return mintPrice + tokenRep[tokenId] * repPrice - (mintPrice / 5); //20% дисконта к цене минта, но контракт покупает всю репу;        
    }
    
    function tokenURI(uint tokenId) public view override _requireMinted(tokenId) returns (string memory) {
        
        string memory _tokenURI = elementsName[uint(tokenType[tokenId])];
        
        string memory _base = _baseURI();

        if(bytes(_base).length == 0){
            return _tokenURI;
        }
        if(bytes(_base).length > 0){
            return string(abi.encodePacked(_base, _tokenURI));
        }

        super.tokenURI(tokenId);
    }
    
    function getDescription(uint tokenId) public view returns(string memory, uint) {
        
        string memory strElement = elementsName[uint(tokenType[tokenId])];
        uint rep = tokenRep[tokenId];
        return(strElement, rep);
    }    
    
    function userNFTs(address user) public view returns(uint[] memory){
        uint countNFT = _balances[user];         
        uint[] memory userNFT = new uint256[](countNFT);
        
        uint i;
        for(uint counter = 0; counter != counterNFT; ++counter){
            if(_owners[counter] == user){
                userNFT[i] = counter;
                ++i;
            }
        }
        
        return userNFT;
    }
    //заготовка под оптимизацию
    /*function getDescription(uint tokenId) public returns(TokenDesc memory) {        
        
        return(tokenbStorage[tokenId]);
    }*/   
    

    function isMintable() public view returns(bool) {
        return (counterNFT < _maxTotalSupply());
    }    
    
    //функции для пользователя
    function mint() external payable {
        
        require(msg.value >= mintPrice, "not enough money");
        require(isMintable(), "mint is over");
        
        uint dropAmount = mintPrice / 3;        
        _distributeAll(dropAmount);
               
        uint tokenId = counterNFT;
        counterNFT++;
        _createNewNFT(tokenId, msg.sender);        
        super._safeMint(msg.sender, tokenId);                
    }

    function buyNFT(uint tokenId) external payable {
        
        uint price = getBuyPrice(tokenId);
        require(msg.value >= price, "not enough money");        
        
        uint dropAmount = price / 3;
        _distributeAll(dropAmount);       
        _repIncrease(tokenId);
        super._safeTransfer(address(this), msg.sender, tokenId);              
    }
    
    function sellNFT(uint tokenId) external {
        
        uint price = getSellPrice(tokenId);
        address payable seller = payable (msg.sender);
        
        super.safeTransferFrom(seller, address(this), tokenId);
        //переводим деньги
        seller.transfer(price);     
    }    

    function burn(uint tokenId) public override {
        
        super.safeTransferFrom(msg.sender, address(this), tokenId);

    }

    //служебные функции      

    receive () external payable {
        revert("please use the buy or mint functions to purchase NFT");
    }
    fallback() external {
       console.logBytes(msg.data);
    }
    
    function preMint() public {
        
        require(!preMintFlag, "can't premint twice");
        //первоначальная эмиссия
        //минтим на баланс контракта 1 джокера и по 10% каждого типа NFT
        address self = address(this);
        //Джокер
        currentSupply[uint(Elements.Jocker)]++;        
        _createNewNFT(0,Elements.Jocker);
        _mint(self, counterNFT);
        ++counterNFT;        
        //Остальные
        for(uint i = 1; i <= 4; ++i){
            Elements element = Elements(i);
            uint count = supply[uint(element)] / 10;
            for(uint j = 0; j != count; ++j){
                currentSupply[uint(element)]++;
                _createNewNFT(counterNFT, element);
                _mint(self, counterNFT);
                ++counterNFT;
            }
        }
        preMintFlag = true;
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
        
        uint random = uint(keccak256(abi.encodePacked(block.timestamp, recipient, tokenId))) % _maxTotalSupply();        
        Elements element = Elements.Earth;

        for(uint counter = 1; counter < 5; ++counter) {
            if(random <= (limits[counter - 1] + limits[counter])) {
                element = Elements(counter);
                counter = 5;
            }
        }
        return element;       
    }

    function _repIncrease(uint tokenId) internal {
        
        uint repInc =  _baseRep[uint(tokenType[tokenId])] / 10; //за каждую простую операцию добавляем 10% базовой репы
        tokenRep[tokenId] += repInc;
        tokenRep[0] += repInc; //Джокер всегда получает премию
    }

    function _totalRepCalc() internal view returns(uint) {
        
        uint totalRep;
        for(uint counter = 0; counter != counterNFT; ++counter){
            totalRep += tokenRep[counter];
        }
        return totalRep;
    } 

    function _createNewNFT(uint tokenId, address recipient) internal {
        
        Elements element = _calculateRandomElement(tokenId, recipient);
        tokenType[tokenId] = element;
        tokenRep[tokenId]=_baseRep[uint(element)];
    }    

    function _createNewNFT(uint tokenId, Elements element) internal {
        
        tokenType[tokenId] = element;
        tokenRep[tokenId]=_baseRep[uint(element)];
    }
    
    function _distributeAll(uint dropAmount) internal {

        uint totalRep = _totalRepCalc();        
        uint dropOnRep = dropAmount / (totalRep !=0 ? totalRep : 1);
        
        for(uint counter = 0; counter != counterNFT; ++counter) {
            if(_owners[counter] != address(this)) {
                uint drop = dropOnRep * tokenRep[counter];
                address payable recipient = payable(_owners[counter]);
                recipient.transfer(drop);
            }
        }               
    }           
}
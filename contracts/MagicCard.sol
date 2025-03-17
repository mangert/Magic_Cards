// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract MagicCard is ERC721, ERC721Enumerable {
    
    address owner; //владелец
    //типы, описывающие токен
    enum  Elements {Jocker, Fire, Air, Water, Earth}         
    
    struct TokenDescription {
        Elements element;
        uint rep;
        string tokenURI;       
    }

    //Эмиссия
    uint[5] public constant supply = [1, 111, 222, 333, 444]; //задаем значения максимального сапплая
    uint[5] constant _baseRep = [1000, 100, 75, 50, 25]; //задаем базовые значения репы  

    
    uint public constant MINT_PRICE = 1000000; 
    uint [5] public currentSupply; // текущая эмиссия NFT каждого типа
    uint counterNFT; // счетчик выпущенных NFT

    //Storage
    mapping(uint => TokenDescription) _tokenStorage;
    uint ownersCounter;

    
    constructor() {

        ERC721("MagicElements", "MEL")
        owner = msg.sender; 
        _preMint();
    }

    //функции для владельца
    function withdraw(address payable recipient) external { //сделать через модификатор
        uint minimumBalance; //сделaть функцию для расчета
        uint amount = address(this).balance - minimumBalance;
        require(msg.sender == owner, "not an owner");
        recipient.transfer(amount);
    }
    
    //функции для пользователя
    function mint() external payable { //сделять через require
        uint value = msg.value;
        if(value >= MINT_PRICE) {
            uint tokenID = counterNFT;
            counterNFT++;
            //создаем токен
            to
            //минтим
        } else{
        //возвращаем деньги    
        }        
    }

    function buy() external payable {
        uint _value = msg.value;
        if(_value >= PRICE){
            
            //переводим токен
        } else{
        //возвращаем деньги    
        }        
    }
    
    function sell() external payable {
                
    }

    function burn() external override {

    }

    function isMintable external view returns(bool){

        return (counterNFT < _maxTotalSupply());
    }


    //служебные функции      
    
    function _preMint() internal {
        //первоначальная эмиссия
        //минтим на баланс контракта 1 джокера и по 10% каждого типа NFT
        address self = address(this);
        //Джокер
        currentSupply[Elements.Jocker]++;
        _tokenStorage[counterNFT] = _createNewNFT(Jocker);
        _mint(self, counterNFT)
        ++counterNFT;        
        //Остальные
        for(Elements element = Elements.Fire; element <= Elements.Earth; ++element){
            uint count = supply[element] / 10;
            for(uint i = 0; i != count; ++i){
                currentSupply[element]++;
                _tokenStorage[counterNFT] = _createNewNFT(element);
                _mint(self, counterNFT)
                ++counterNFT;
            }
        }
    }    

    function _maxTotalSupply internal view returns (uint) {
        uint maxSupply;
        for (uint counter = 0; counter != supply.length; ++counter) {
            maxSupply += supply[counter];
        }
        return maxSupply;
    }

    function _calculateRandomElement(uint tokenId, address recipient) internal pure returns(Elements) {
        //

    }

    function _totalRepCalc() internal view returns(uint) {
        
        uint totalRep;
        for(uint counter = 0; counter != counterNFT; ++counter){
            totalRep += _tokenStorage[counter].rep;
        }
        return totalRep;
    }
    
    function _random(uint count, address recipient) private pure returns (uint) {
     
        randNonce = count;
        uint random = uint(keccak256(abi.encodePacked(block.timestamp, recipient, randNonce))) % count;
    }
    
    function _createNewNFT(Elements element) internal returns (TokenDescription){
        
        TokenDescription token = {element, _baseRep[element], ""};
        return token;
    }  
     
    
    function _createNewNFT() internal returns (TokenDescription){
        Elements element; //выбираем тип NFt

        return _createNewNFT(Elements element);

    }

    function _calculateRepIncrease() internal view returns(uint){
        return 0;
    }

    function _calculateDrop(uint amount) internal view returns(uint){
        return 0;
    }
    
    function _distributeAll() internal {
        
        //(bool sucsess, ) = myAddress.call{value: msg.value}("magic drop")
        //(payable)myAddress.Transfer(amount);
        //_tokenStorage[tokenID].rep +=10;

    }
    

    /*
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }*/
   /*черновик
    function tokenURI(uint tokenId) public view override _requireMinted(tokenId) {
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory _base = _baseURI();

        if(bytes(_base).length == 0){
            return _tokenURI;
        }
        if(bytes(_base).length > 0){
            return string(abi.encodePacked(_base, _tokenURI));
        }

        super.tokenURI(tokenId);
    }

    function _setTokenURI(uint tokenId, string memory _tokenURI) internal virtual _requireMinted(tokenID) {
        _tokenURIs[tokenId] = _tokenURI;

    }

    function burn(uint tokenId) public override {
        super.burn(tokenId);

    }*/



}
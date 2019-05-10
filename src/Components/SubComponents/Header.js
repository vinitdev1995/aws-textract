import React, {Component} from "react"
import {Collapse, Navbar, NavbarBrand, Nav, NavItem, NavLink} from 'reactstrap';
import muniImg from "../../images/munivisor.png";

const Header = () => (
    <div>
        <Navbar color="light" light expand="md" style={{height: '52px'}}>
            <NavbarBrand href="https://www.munivisor.com/">
                <img style={{height: 45, width: 162}} className="main-logo" src={muniImg} alt="MuniVisor"/>
            </NavbarBrand>
            <Collapse navbar>
                <Nav className="ml-auto m-auto" navbar>
                    <NavItem>
                        <NavLink className="text-uppercase"
                                 href="/components/"
                                 style={{fontSize: "23px", color: "#f3a435"}}>Otaras Textract Engine</NavLink>
                    </NavItem>
                </Nav>
            </Collapse>
        </Navbar>
    </div>
)

export default Header